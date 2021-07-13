const core = require('@actions/core');
const github = require('@actions/github');

(async () => {
    // extract input
    const token = core.getInput('token', {required: true});
    const octokit = github.getOctokit(token);
    const {context} = github;
    const {
        sha,
        payload
    } = context;
    const {repository} = payload;

    const repo = repository.name;
    const owner = repository.full_name.split('/')[0];

    const base = context.payload.before;
    const head = context.payload.after;

    core.info(`Base commit: ${base}`);
    core.info(`Head commit: ${head}`);

    console.log('octokit', octokit);
    console.log('rest', octokit.rest);
    console.log('repos', octokit.rest.repos);

    const compare = await octokit.rest.repos.compareCommits({
        base,
        head,
        owner: context.repo.owner,
        repo: context.repo.repo
    });

    core.info(compare);

})().catch((error) => {
    core.setFailed(error);
    process.exit(1);
});
