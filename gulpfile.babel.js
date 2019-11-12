import gulp from 'gulp';
import yargs from 'yargs';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import imagemin from 'gulp-imagemin';
import del from 'del';
import webpack from 'webpack-stream';
import uglify from 'gulp-uglify';
import bourbon from 'node-bourbon';
import browserSync from 'browser-sync';
import pug from 'gulp-pug';
import concat from "gulp-concat";
import info from './package.json';

const server = browserSync.create();
const PRODUCTION = yargs.argv.prod;

const paths = {
    styles: {
        src: ['src/scss/main.scss', 'src/scss/header.scss', 'src/scss/fonts.scss'],
        dest: 'dist/css',
    },
    scripts: {
        src: ['src/js/bundle.js'],
        dest: 'dist/js'
    },
    images: {
        src: 'src/images/**/*.{jpg,jpeg,png,svg,gif,ico}',
        dest: 'dist/images',
    },
    other: {
        src: ['src/*', 'src/**/*','!src/*.pug', '!src/{images,js,libs,pug,scss}', '!src/{images,js,libs,pug,scss}/**/*'],
        dest: 'dist'
    },
    libs: {
        src: [
            'node_modules/normalize.css/normalize.css',
        ],
        dest: 'dist/libs',
    },
    pug: {
        src: ['src/*.pug'],
        dest: "dist"
    }
};

export const pugToHtml = () => {
    return gulp.src(paths.pug.src)
        .pipe(pug({
            pretty: !PRODUCTION
        }))
        .pipe(gulp.dest(paths.pug.dest))
};

export const libs = () => {
    return gulp.src(paths.libs.src)
        .pipe(gulp.dest(paths.libs.dest))
};

export const serve = done => {
    server.init({
        server: {
            baseDir: './dist'
        },
    });
    done();
};

export const reload = done => {
    server.reload();
    done();
};

export const clean = () => del(['dist']);

export const styles = () => {
    return gulp.src(paths.styles.src)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass({
            includePaths: bourbon.includePaths
        }).on('error', sass.logError))
        .pipe(gulpif(PRODUCTION, cleanCSS({compatibility: 'ie8'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(server.stream());
};

export const images = () => {
    return gulp.src(paths.images.src)
        .pipe(gulpif(PRODUCTION, imagemin()))
        .pipe(gulp.dest(paths.images.dest));
};

export const copy = () => {
    return gulp.src(paths.other.src)
        .pipe(gulp.dest(paths.other.dest))
};

export const watch = () => {
    gulp.watch('src/scss/**/*.scss', styles);
    gulp.watch('src/js/**/*.js', gulp.series(scripts, reload));
    gulp.watch('**/*.php', reload);
    gulp.watch('src/**/*.pug', gulp.series(pugToHtml, reload));
    gulp.watch('src/*.pug', gulp.series(pugToHtml, reload));
    gulp.watch(paths.images.src, gulp.series(images, reload));
    gulp.watch(paths.other.src, gulp.series(copy, reload));
};

export const scripts = () => {
    return gulp.src(paths.scripts.src)
    // .pipe(named())
        .pipe(webpack({
            module: {
                rules: [
                    {
                        test: /\.js$/,
                        use: {
                            loader: 'babel-loader',
                            options: {
                                presets: ['babel-preset-env'] //or ['babel-preset-env']
                            }
                        }
                    }
                ]
            },
            output: {
                filename: '[name].js'
            },
            externals: {
                '$': 'jQuery'
            },
            devtool: !PRODUCTION ? 'inline-source-map' : false,
            mode: PRODUCTION ? 'production' : 'development' //add this
        }))
        .pipe(gulpif(PRODUCTION, uglify())) //you can skip this now since mode will already minify
        .pipe(gulp.dest(paths.scripts.dest));
};

export const dev = gulp.series(clean, gulp.parallel(styles, scripts, images,  libs, pugToHtml, copy), serve, watch);
export const build = gulp.series(clean, gulp.parallel(styles, scripts, images, libs, pugToHtml, copy));

export default dev;
