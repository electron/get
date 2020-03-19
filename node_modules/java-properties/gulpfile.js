var gulp = require('gulp'),
  babel = require('gulp-babel'),
  jshint = require('gulp-jshint'),
  seq = require('gulp-sequence'),
  nodeunit = require('gulp-nodeunit');

gulp.task('lint', function() {
  return gulp.src(['src/**/*.js', 'test/**/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('babel', function() {
  return gulp.src(['src/**/*.js'])
    .pipe(babel())
    .pipe(gulp.dest('lib'));
});
gulp.task('test', ['babel'], function() {
  return gulp.src('test/**/*.js')
    .pipe(nodeunit());
});

gulp.task('watch', function() {
  gulp.watch(['src/**/*.js', 'test/**/*.js'], ['build-and-test']);
});

gulp.task('build-and-test', function(cb) {
  seq('babel', 'test')(cb); 
});

gulp.task('default', ['lint', 'build-and-test', 'watch']);

