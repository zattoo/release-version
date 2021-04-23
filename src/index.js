const core = require('@actions/core');
const github = require('@actions/github');

const createVersion = require('./create-version');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const version = core.getInput('version', {required: true});
    const project = core.getInput('project', {required: false});
    const strategy = core.getInput('strategy', {required: false});
    const production = core.getInput('production', {required: false});
    const releaseDateFormat = core.getInput('release-date-format', {required: false});
    const octokit = github.getOctokit(token);
    const repo = github.context.payload.repository.name;
    const owner = github.context.payload.repository.full_name.split('/')[0];
    // commit id where we start
    const baseSha = github.context.sha;
    // branch name where we start
    const baseRef = github.context.ref;
    const context = {
        repo,
        owner,
    };
    const baseFilePayload = {
        mode: '100644',
        type: 'blob',
    };

    if (!['release', 'hotfix'].includes(strategy)) {
        throw new Error('Strategy can be either release ot hotfix.');
    }

    if ((strategy === 'release') && (baseRef !== 'refs/heads/master')) {
        throw new Error('Release can only be created from master branch.');
    }

    if (strategy === 'hotfix') {
        if (
            (project && baseRef !== `refs/heads/${production}/${project}`) || (!project && baseRef !== `refs/heads/${production}`)
        ) {
            throw new Error('Hotfix can only be created from production branch.');
        }
    }

    // prepare names
    let releaseBranch = strategy;
    let productionBranch = production;
    let releaseTitle = `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} ${version}`;
    if (project) {
        releaseTitle = `${releaseTitle}-${project}`;
        releaseBranch = `${releaseBranch}/${project}`;
        productionBranch = `${productionBranch}/${project}`;
    }

    // make changes
    const releaseDate = createVersion.getReleaseDate(releaseDateFormat);
    const changelog = await createVersion.changeChangelogVersion(version, project, releaseDate);
    const pkg = await createVersion.changePackageVersion(version, project);
    const releaseDescription = createVersion.extractReleaseChangelog(changelog[1]);

    try {
        await octokit.git.createRef({
            ...context,
            ref: `refs/heads/${releaseBranch}`,
            sha: baseSha,
        });
    } catch (e) {
        throw new Error(`Branch ${releaseBranch} already exists.`);
    }
    const {data: tree} = await octokit.git.createTree({
        ...context,
        base_tree: baseSha,
        tree: [
            {
                ...baseFilePayload,
                path: changelog[0],
                content: changelog[1],
            },
            {
                ...baseFilePayload,
                path: pkg[0],
                content: pkg[1],
            },
        ],
    });
    const {data: commit} = await octokit.git.createCommit({
        ...context,
        message: releaseTitle,
        tree: tree.sha,
        parents: [baseSha],
    });
    await octokit.git.updateRef({
        ...context,
        sha: commit.sha,
        ref: `heads/${releaseBranch}`,
    });

    const releasePullRequest = await octokit.pulls.create({
        ...context,
        title: releaseTitle,
        body: releaseDescription,
        head: releaseBranch,
        base: productionBranch,
        maintainer_can_modify: true, // allows maintainers to edit pull-request
    });

    try {
        await octokit.issues.getLabel({
            ...context,
            name: strategy,
        });
    } catch (err) {
        await octokit.issues.createLabel({
            ...context,
            name: strategy,
            color: '000000',
        });
    }
    await octokit.issues.addLabels({
        ...context,
        issue_number: releasePullRequest.data.number,
        labels: [strategy],
    });
})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
