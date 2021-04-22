const fsp = require('fs').promises;

const createVersion = require('../create-version');

describe('getReleaseDate', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should throw error for wrong format', () => {
        expect(() => createVersion.getReleaseDate('abs'))
            .toThrow('Invalid release date format');
    });
    it('should throw error for almost wrong format', () => {
        expect(() => createVersion.getReleaseDate('YYY-DD-MM'))
            .toThrow('Invalid release date format');
    });
    it('should provide proper date with leading zeros', () => {
        const date = new Date('2021-04-01');
        jest.spyOn(global, 'Date').mockImplementationOnce(() => date);
        expect(createVersion.getReleaseDate('YYYY-MM-DD')).toBe('2021-04-01');
    });
});

describe('changePackageVersion', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should throw error for no version', async () => {
        await expect(createVersion.changePackageVersion(undefined)).rejects
            .toThrow('No version specified.');
    });

    it('should throw error if file not found', async () => {
        jest.spyOn(fsp, 'stat').mockImplementationOnce(() => Promise.resolve(false));
        await expect(createVersion.changePackageVersion('1.0.0')).rejects
            .toThrow('Cannot find package.json');
    });
});

describe('changeChangelogVersion', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should throw error for no version', async () => {
        await expect(createVersion.changeChangelogVersion(undefined)).rejects
            .toThrow('No version specified.');
    });

    it('should throw error if file not found', async () => {
        jest.spyOn(fsp, 'stat').mockImplementationOnce(() => Promise.resolve(false));
        await expect(createVersion.changeChangelogVersion('1.0.0')).rejects
            .toThrow('Cannot find CHANGELOG.md');
    });

    it('should throw error if changelog has no unreleased', async () => {
        jest.spyOn(fsp, 'stat').mockImplementationOnce(() => Promise.resolve(true));
        jest.spyOn(fsp, 'readFile').mockImplementationOnce(() => Promise.resolve('foobar'));
        await expect(createVersion.changeChangelogVersion('1.0.0')).rejects
            .toThrow('Cannot find Unreleased section in CHANGELOG.md');
    });

    it('should change unreleased for release', async () => {
        jest.spyOn(fsp, 'stat').mockImplementationOnce(() => Promise.resolve(true));
        jest.spyOn(fsp, 'readFile').mockImplementationOnce(() => Promise.resolve('## Unreleased'));
        const spy = jest.spyOn(fsp, 'writeFile').mockImplementationOnce(() => Promise.resolve());
        await createVersion.changeChangelogVersion('1.2.3', null, '2021-01-04');
        expect(spy.mock.calls[0]).toEqual(['CHANGELOG.md', '## [1.2.3] - 2021-01-04']);
    });

    it('should change unreleased for release with project', async () => {
        jest.spyOn(fsp, 'stat').mockImplementationOnce(() => Promise.resolve(true));
        jest.spyOn(fsp, 'readFile').mockImplementationOnce(() => Promise.resolve('## Unreleased'));
        const spy = jest.spyOn(fsp, 'writeFile').mockImplementationOnce(() => Promise.resolve());
        await createVersion.changeChangelogVersion('2.5.9', 'app', '2021-01-04');
        expect(spy.mock.calls[0]).toEqual(['projects/app/CHANGELOG.md', '## [2.5.9] - 2021-01-04']);
    });
});

const changelogContent = `# Changelog
All notable changes to this project will be documented in this file.

## [1.0.1] - 09.04.2021

### Added
- Some Functionality

## [1.0.0] - 09.04.2021

### Added
- Initial Functionality
`;

const releaseContent = `## [1.0.1] - 09.04.2021

### Added
- Some Functionality
`;

describe('extractReleaseChangelog', () => {
    it('extract changelog content', () => {
        const result = createVersion.extractReleaseChangelog(changelogContent);
        expect(result).toEqual(releaseContent);
    });
});
