var fs = require('fs-extra'),
    path = require('path'),
    should = require('should'),
    cli = require('../../lib/cli'),
    dmn = require('../../index');


describe('gen', function () {
    var tmpPath = path.join(__dirname, '../tmp');

    cli.silent = true;

    //NOTE: ensureDir which can be safely passed to Array.forEach()
    //(learn more: http://www.wirfs-brock.com/allen/posts/166)
    function ensureDirSync(dir) {
        fs.ensureDirSync(dir, 0777);
    }

    beforeEach(function () {
        fs.ensureDirSync(tmpPath);
        process.chdir(tmpPath);
    });

    afterEach(function (done) {
        process.chdir(__dirname);
        fs.remove(tmpPath, done);
    });

    it('should add ignores with respect to existing .npmignore file', function (done) {
        var projectFiles = [
                '.travis.yml',
                'Gulpfile.js',
                'index.js',
                'package.json',
                'HISTORY',
                'Makefile'
            ],
            projectDirs = [
                'lib',
                'test',
                'coverage',
                'benchmark'
            ],
            srcIgnoreFile = [
                '.travis.yml',
                '!Makefile',
                'test',
                'example/',
                '!benchmark/'
            ].join('\r\n');

        projectFiles.forEach(fs.ensureFileSync);
        projectDirs.forEach(ensureDirSync);
        fs.writeFileSync('.npmignore', srcIgnoreFile);

        dmn.gen(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: saved');

            var ignoreFile = fs.readFileSync('.npmignore').toString();

            //NOTE: see comments in findPatternsToAdd() in ../../lib/gen.js
            if (process.platform === 'win32') {
                ignoreFile.should.eql([
                    '.travis.yml',
                    '!Makefile',
                    'test',
                    'example/',
                    '!benchmark/',
                    '',
                    '.npmignore',
                    'coverage/',
                    'Gulpfile.js',
                    'gulpfile.js',
                    'HISTORY',
                    'History'
                ].join('\r\n'));
            }

            else {
                ignoreFile.should.eql([
                    '.travis.yml',
                    '!Makefile',
                    'test/',
                    '!benchmark/',
                    '',
                    '.npmignore',
                    'coverage/',
                    'Gulpfile.js',
                    'HISTORY'
                ].join('\r\n'));
            }

            done();
        });
    });

    it('should create new .npmignore file if it does not exists', function (done) {
        var projectDirs = [
            'lib',
            'test',
            'coverage',
            'benchmark'
        ];

        projectDirs.forEach(ensureDirSync);

        dmn.gen(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: saved');

            var ignoreFile = fs.readFileSync('.npmignore').toString();

            ignoreFile.should.eql([
                '# Generated by dmn (https://github.com/inikulin/dmn)',
                '',
                '.npmignore',
                'benchmark/',
                'coverage/',
                'test/'
            ].join('\r\n'));

            done();
        });
    });

    it('should not modify .npmignore if it is already perfect', function (done) {
        var projectDirs = [
                'lib',
                'test',
                'coverage',
                'benchmark'
            ],
            srcIgnoreFile = [
                '.npmignore',
                'coverage/',
                'test/',
                'benchmark/'
            ].join('\r\n');

        projectDirs.forEach(ensureDirSync);
        fs.writeFileSync('.npmignore', srcIgnoreFile);

        dmn.gen(tmpPath, {force: true}).done(function (status) {
            status.should.eql('OK: already-perfect');

            var ignoreFile = fs.readFileSync('.npmignore').toString();

            ignoreFile.should.eql(srcIgnoreFile);

            done();
        });
    });

    it('should cancel .npmignore file update on user demand if "force" flag disabled', function (done) {
        var projectDirs = [
                'lib',
                'test',
                'coverage',
                'benchmark'
            ],
            srcIgnoreFile = [
                '.npmignore',
                'benchmark/'
            ].join('\r\n');

        projectDirs.forEach(ensureDirSync);
        fs.writeFileSync('.npmignore', srcIgnoreFile);

        cli.confirm = function (what, callback) {
            callback(false);
        };

        dmn.gen(tmpPath, {force: false}).done(function (status) {
            status.should.eql('OK: canceled');

            var ignoreFile = fs.readFileSync('.npmignore').toString();

            ignoreFile.should.eql(srcIgnoreFile);

            done();
        });
    });

    it('should update .npmignore file update on user confirmation if "force" flag disabled', function (done) {
        var projectDirs = [
                'lib',
                'test',
                'coverage',
                'benchmark'
            ],
            srcIgnoreFile = [
                '.npmignore',
                'benchmark/'
            ].join('\r\n');

        projectDirs.forEach(ensureDirSync);
        fs.writeFileSync('.npmignore', srcIgnoreFile);

        cli.confirm = function (what, callback) {
            callback(true);
        };

        dmn.gen(tmpPath, {force: false}).done(function (status) {
            status.should.eql('OK: saved');

            var ignoreFile = fs.readFileSync('.npmignore').toString();

            ignoreFile.should.eql([
                '.npmignore',
                'benchmark/',
                '',
                'coverage/',
                'test/'
            ].join('\r\n'));

            done();
        });
    });
});
