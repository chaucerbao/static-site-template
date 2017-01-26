// Directory paths
const path = require('path')
const src = { path: path.resolve('src') }
const tmp = { path: path.resolve('.tmp') }
const dist = { path: path.resolve('dist') }

// General dependencies
const gulp = require('gulp')
const pump = require('pump')
const del = require('del')
const filter = require('gulp-filter')
const through = require('through2')
const rev = require('gulp-rev')
const revReplace = require('gulp-rev-replace')
const sourcemaps = require('gulp-sourcemaps')
const browserSync = require('browser-sync').create()

// Stylesheet processing dependencies
const sass = require('gulp-sass')
const postcss = require('gulp-postcss')
const cssnano = require('cssnano')

// Javascript processing dependencies
const browserify = require('browserify')
const uglify = require('gulp-uglify')

// HTML processing dependencies
const nunjucks = require('gulp-nunjucks')
const nj = require('nunjucks')
const htmlmin = require('gulp-htmlmin')

// Generate source file paths
Object.assign(src, {
  css: path.join(src.path, 'css'),
  js: path.join(src.path, 'js'),
  html: path.join(src.path, 'html'),
  img: path.join(src.path, 'img'),
  font: path.join(src.path, 'font')
})
Object.assign(tmp, {
  css: path.join(tmp.path, 'css'),
  js: path.join(tmp.path, 'js')
})

// Tasks
gulp.task('css', callback => {
  pump(
    gulp.src([
      path.join(src.css, '*.scss'),
      '!' + path.join(src.css, '_*.scss')
    ]),
    sourcemaps.init(),
    sass({ includePaths: [ src.css ] }),
    postcss([ cssnano({ autoprefixer: { add: true } }) ]),
    sourcemaps.write('.'),
    gulp.dest(tmp.css),
    browserSync.stream(),
    callback
  )
})

gulp.task('js', callback => {
  const browserifyOptions = { paths: [ src.js ], debug: true }

  const bundler = () => {
    return through.obj((file, encoding, next) => {
      browserify(file.path, browserifyOptions).bundle((err, buffer) => {
        if (err) {
          return next(err)
        }
        file.contents = buffer
        next(null, file)
      })
    })
  }

  pump(
    gulp.src(path.join(src.js, '*.js')),
    bundler(),
    sourcemaps.init({ loadMaps: true }),
    uglify(),
    sourcemaps.write('.'),
    gulp.dest(tmp.js),
    browserSync.stream(),
    callback
  )
})

gulp.task('html', callback => {
  pump(
    gulp.src([
      path.join(src.path, '**', '*.html'),
      '!' + path.join(src.html, '**')
    ]),
    nunjucks.compile(null, {
      env: new nj.Environment(new nj.FileSystemLoader(src.html))
    }),
    htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      sortAttributes: true,
      sortClassName: true
    }),
    gulp.dest(tmp.path),
    browserSync.stream(),
    callback
  )
})

gulp.task('static', callback => {
  pump(
    gulp.src([ path.join(src.img, '**'), path.join(src.font, '**') ], {
      base: src.path
    }),
    gulp.dest(tmp.path),
    browserSync.stream(),
    callback
  )
})

gulp.task('build', [ 'css', 'js', 'html', 'static' ])

gulp.task('dist', [ 'build' ], callback => {
  const assetFilter = filter([ '**', '!*.html', '!*.map' ], {
    restore: true,
    matchBase: true
  })

  pump(
    gulp.src(path.join(tmp.path, '**')),
    assetFilter,
    rev(),
    assetFilter.restore,
    revReplace(),
    gulp.dest(dist.path),
    callback
  )
})

gulp.task('clean', () => del([ tmp.path, dist.path ]))

gulp.task('default', [ 'build' ], () => {
  gulp.watch(path.join(src.css, '**', '*.scss'), [ 'css' ])
  gulp.watch(path.join(src.js, '**', '*.js'), [ 'js' ])
  gulp.watch(path.join(src.path, '**', '*.html'), [ 'html' ])
  gulp.watch([ path.join(src.img, '**'), path.join(src.font, '**') ], [
    'static'
  ])

  browserSync.init({ open: false, server: { baseDir: tmp.path } })
})
