const fsp = require('fs').promises;

/**
 * @param {string} releaseDateFormat - e.g. DD.MM.YYYY
 * @returns {string}
 */
module.exports.getReleaseDate = (releaseDateFormat) => {
    const now = new Date();
    if (!releaseDateFormat.includes('YYYY') || !releaseDateFormat.includes('DD') || !releaseDateFormat.includes('MM')) {
        throw new Error('Invalid release date format');
    }
    return releaseDateFormat
        .replace('YYYY', now.getFullYear())
        .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(now.getDate()).padStart(2, '0'));
};

/**
 * @param {string} version
 * @param {string} [project]
 * @returns {string}
 */
module.exports.changePackageVersion = async (version, project) => {
    if (!version) {
        throw new Error('No version specified.');
    }

    let pkgPath = 'package.json';
    if (project) {
        pkgPath = `projects/${project}/${pkgPath}`;
    }
    if (!(await fsp.stat(pkgPath))) {
        throw new Error('Cannot find package.json');
    }

    const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf8'));
    pkg.version = `${version}`;
    const modifiedPkg = `${JSON.stringify(pkg, null, 4)}\n`;
    // await fsp.writeFile(pkgPath, modifiedPkg);
    return [pkgPath, modifiedPkg];
};

/**
 * @param {string} version
 * @param {string} [project]
 * @param {string} [releaseDate]
 * @returns {string}
 */
module.exports.changeChangelogVersion = async (version, project, releaseDate) => {
    if (!version) {
        throw new Error('No version specified.');
    }

    let changelogPath = 'CHANGELOG.md';
    if (project) {
        changelogPath = `projects/${project}/${changelogPath}`;
    }
    if (!(await fsp.stat(changelogPath))) {
        throw new Error('Cannot find CHANGELOG.md');
    }

    const changelog = await fsp.readFile(changelogPath, 'utf8');
    if (!changelog.includes('## Unreleased')) {
        throw new Error('Cannot find Unreleased section in CHANGELOG.md');
    }
    const modifiedChangelog = changelog.replace('## Unreleased', `## [${version}] - ${releaseDate}`);
    // await fsp.writeFile(changelogPath, changelog);
    return [changelogPath, modifiedChangelog];
};
