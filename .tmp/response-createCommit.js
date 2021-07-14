const response = {
    status: 201,
    url: 'https://api.github.com/repos/zattoo/cactus/git/commits',
    headers: {
        'access-control-allow-origin': '*',
        'access-control-expose-headers': 'ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval, X-GitHub-Media-Type, Deprecation, Sunset',
        'cache-control': 'private, max-age=60, s-maxage=60',
        connection: 'close',
        'content-length': '825',
        'content-security-policy': 'default-src \'none\'',
        'content-type': 'application/json; charset=utf-8',
        date: 'Wed, 14 Jul 2021 18:11:00 GMT',
        etag: '"27fd507c60c9b9d96194a35383dec1009ce403d711455b4d433d32b48bffec20"',
        location: 'https://api.github.com/repos/zattoo/cactus/git/commits/de648e4877b3d7ee75eeb0ef71d58d5c35d74949',
        'referrer-policy': 'origin-when-cross-origin, strict-origin-when-cross-origin',
        server: 'GitHub.com',
        'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
        vary: 'Accept, Authorization, Cookie, X-GitHub-OTP, Accept-Encoding, Accept, X-Requested-With',
        'x-accepted-oauth-scopes': '',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'deny',
        'x-github-media-type': 'github.v3; format=json',
        'x-github-request-id': '0647:5026:582EC6:C1887B:60EF28B4',
        'x-oauth-scopes': 'delete:packages, gist, notifications, repo, user, workflow, write:discussion, write:packages',
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4972',
        'x-ratelimit-reset': '1626289366',
        'x-ratelimit-resource': 'core',
        'x-ratelimit-used': '28',
        'x-xss-protection': '0'
    },
    data: {
        sha: 'de648e4877b3d7ee75eeb0ef71d58d5c35d74949',
        node_id: 'MDY6Q29tbWl0Mzg1NTkyNjE0OmRlNjQ4ZTQ4NzdiM2Q3ZWU3NWVlYjBlZjcxZDU4ZDVjMzVkNzQ5NDk=',
        url: 'https://api.github.com/repos/zattoo/cactus/git/commits/de648e4877b3d7ee75eeb0ef71d58d5c35d74949',
        html_url: 'https://github.com/zattoo/cactus/commit/de648e4877b3d7ee75eeb0ef71d58d5c35d74949',
        author: {
            name: 'Bogdan Plieshka',
            email: 'bogdanplieshka@gmail.com',
            date: '2021-07-14T17:59:51Z'
        },
        committer: {
            name: 'Bogdan Plieshka',
            email: 'bogdanplieshka@gmail.com',
            date: '2021-07-14T17:59:51Z'
        },
        tree: {
            sha: '153fd86521d4df086c226989701f094bd4a11f6b',
            url: 'https://api.github.com/repos/zattoo/cactus/git/trees/153fd86521d4df086c226989701f094bd4a11f6b'
        },
        message: 'Patch 1',
        parents: [],
        verification: {
            verified: false,
            reason: 'unsigned',
            signature: null,
            payload: null
        }
    }
};
