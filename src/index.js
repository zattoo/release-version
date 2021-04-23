const core = require('@actions/core');
const {
    context,
    getOctokit,
} = require('@actions/github');

const createVersion = require('./create-version');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const version = core.getInput('version', {required: true});
    const project = core.getInput('project', {required: false});
    const strategy = core.getInput('strategy', {required: false});
    const production = core.getInput('production', {required: false});
    const releaseDateFormat = core.getInput('release-date-format', {required: false});
    const octokit = getOctokit(token);
    const {payload} = context;
    const repo = payload.repository.name;
    const owner = payload.repository.full_name.split('/')[0];
    const basePayload = {
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

    // prepare names
    let releaseBranch = strategy;
    let productionBranch = production;
    let releaseTitle = `${strategy.charAt(0).toUpperCase() + strategy.slice(1)} ${version}`;
    if (project) {
        releaseTitle = `${releaseTitle}-${project}.`;
        releaseBranch = `${releaseBranch}/${project}`;
        productionBranch = `${productionBranch}/${project}`;
    }

    // make changes
    const releaseDate = createVersion.getReleaseDate(releaseDateFormat);
    const changelog = await createVersion.changeChangelogVersion(version, project, releaseDate);
    const pkg = await createVersion.changePackageVersion(version, project);
    const releaseDescription = createVersion.extractReleaseChangelog(changelog[1], version);

    try {
        await octokit.git.createRef({
            ...basePayload,
            ref: `refs/heads/${releaseBranch}`,
            sha: context.sha,
        });
    } catch (e) {
        throw new Error(`Branch ${releaseBranch} already exists.`);
    }
    const {data: tree} = await octokit.git.createTree({
        ...basePayload,
        base_tree: context.sha,
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
        ...basePayload,
        message: releaseTitle,
        tree: tree.sha,
        parents: [context.sha],
    });
    await octokit.git.updateRef({
        ...basePayload,
        sha: commit.sha,
        ref: `heads/${releaseBranch}`,
    });

    await octokit.pulls.create({
        ...basePayload,
        title: releaseTitle,
        body: releaseDescription,
        head: releaseBranch,
        base: productionBranch,
        maintainer_can_modify: true, // allows maintainers to edit pull-request
    });
})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
