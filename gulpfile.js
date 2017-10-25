var gulp = require('gulp');

var plumber = require('gulp-plumber');

var browserSync = require('browser-sync');
var reload = browserSync.reload;

var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

// for prod
var uglify = require('gulp-uglify');
var cssmin = require('gulp-cssmin');
var minifyHTML = require('gulp-minify-html');

// BUILDING FOR DEVELOPMENT!

gulp.task('fonts', function() {
	return gulp.src('src/style/fonts/*')
		.pipe(plumber())
		.pipe(gulp.dest('tmp/style/fonts'))
});
gulp.task('less', function() {
	return gulp.src('src/style/styles.less')
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(less())
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('tmp/style'))
		.pipe(reload({ stream: true }));
});
gulp.task('styles', ['fonts','less']);

gulp.task('images', function() {
	return gulp.src('src/images/*')
		.pipe(plumber())
		.pipe(gulp.dest('tmp/images'))
});

gulp.task('html', function() {
	return gulp.src('src/index.html')
		.pipe(plumber())
		.pipe(gulp.dest('tmp'))
		.pipe(reload({ stream: true }));
});

gulp.task('js', function() {
	return gulp.src('src/js/*')
		.pipe(plumber())
		.pipe(gulp.dest('tmp/js'))
});

gulp.task('developmentBuildTmp',['styles','images','html','js']);

gulp.task('watch', function() {
	gulp.watch('src/style/styles.less', ['less']);
	gulp.watch('src/index.html', ['html']);
	gulp.watch('src/js/*', ['js']);
});

// Builds the tmp development dir, serves it, and reload the browser on style changes
gulp.task('serve', ['developmentBuildTmp'], function() {
	browserSync({
		server : {
			baseDir: ['tmp']
		}
	});
	gulp.start('watch');
});


// BUILDING FOR PRODUCTION!

gulp.task('fonts:prod', function() {
	return gulp.src('src/style/fonts/*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/style/fonts'))
});
gulp.task('less:prod', function() {
	return gulp.src('src/style/styles.less')
		.pipe(plumber())
		.pipe(less())
		.pipe(autoprefixer({
			browsers: ['last 2 versions'],
			cascade: false
		}))
		.pipe(cssmin())
		.pipe(gulp.dest('dist/style'));
});
gulp.task('styles:prod', ['fonts:prod','less:prod']);

gulp.task('images:prod', function() {
	return gulp.src('src/images/*')
		.pipe(plumber())
		.pipe(gulp.dest('dist/images'))
});

gulp.task('html:prod', function() {
	return gulp.src('src/index.html')
		.pipe(plumber())
		.pipe(minifyHTML({}))
		.pipe(gulp.dest('dist'))
});

gulp.task('js:prod', function() {
	return gulp.src('src/js/*')
		.pipe(plumber())
		.pipe(uglify({compress:true}))
		.pipe(gulp.dest('dist/js'))
});

gulp.task('cname:prod', function() {
	return gulp.src('CNAME')
		.pipe(plumber())
		.pipe(gulp.dest('dist'))
});

gulp.task('build',['styles:prod','images:prod','html:prod','js:prod','cname:prod']);
