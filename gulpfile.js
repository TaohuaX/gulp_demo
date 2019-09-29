const gulp = require('gulp');
const del = require('del'); // 清除文件夹
const cache = require('gulp-cache');//压缩图片可能会占用较长时间，使用 gulp-cache 插件可以减少重复压缩。
const connect=require('gulp-connect');//引入gulp-connect模块 浏览器刷新
const rev = require("gulp-rev");//md5后缀
const revCollector = require("gulp-rev-collector");//替换html中的路径

const minifyHtml = require("gulp-minify-html");//压缩html
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer'); //加css前缀
const minifyCSS = require('gulp-clean-css'); //压缩css
// npm install --save-dev gulp-babel@7 babel-core babel-preset-env
const babel = require("gulp-babel");
const uglify = require('gulp-uglify'); //js压缩

const imagemin = require('gulp-imagemin');//压缩图片文件
const pngquant = require('imagemin-pngquant');//图片深入压缩
const imageminOptipng = require('imagemin-optipng');
const imageminSvgo = require('imagemin-svgo');
const imageminGifsicle = require('imagemin-gifsicle');
const imageminJpegtran = require('imagemin-jpegtran');
// const rename = require('gulp-rename');//重命名
// const concat=require('gulp-concat');   //合并文件
// const notify=require('gulp-notify'); // 提示
// .pipe(notify({message: 'images task ok'})) // 用法 
// const browserSync = require("browser-sync").create(), //自动刷新
        // reload = browserSync.reload;
// const filter = require('gulp-filter');
// gulp-filter 包， 以确保只有 *.css 文件响应 .reload - 这样一来，
// const useref = require('gulp-useref'); //合并JS
// var runSequence = require('run-sequence');//组织任务执行顺序,未使用
// var jshint = require("gulp-jshint");//js检查

gulp.task('images', function() {
    return gulp.src('src/images/*.*')
        // Caching images that ran through imagemin
        .pipe(cache(imagemin({     
            progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片          
            svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
            use: [pngquant(),imageminJpegtran({progressive: true})
            , imageminGifsicle({interlaced: true}),imageminOptipng({optimizationLevel:3}), imageminSvgo()] //使用pngquant深度压缩png图片的imagemin插件          
        })))
        .pipe(gulp.dest('dist/images'))
});


gulp.task('css',function(){//编译scss
    return gulp.src('src/scss/*.scss')
    .pipe(autoprefixer())
    .pipe(rev())
    .pipe(sass())//编译scss
    // .pipe(gulp.dest('app/css')) //当前对应css文件
    .pipe(minifyCSS({
        compatibility: 'ie8',//保留ie7及以下兼容写法 类型：String 默认：''or'*' [启用兼容模式； 'ie7'：IE7兼容模式，'ie8'：IE8兼容模式，'*'：IE9+兼容模式]
        keepSpecialComments: '*'
        //保留所有特殊前缀 当你用autoprefixer生成的浏览器前缀，如果不加这个参数，有可能将会删除你的部分前缀
    }))
    // .pipe(rename({suffix:'.min'}))
    .pipe(gulp.dest('dist/scss/')) //当前对应css文件
    .pipe(rev.manifest('rev-css-manifest.json'))
    .pipe(gulp.dest('dist/rev/scss'))
    .pipe(connect.reload())//更新
})
 
gulp.task('js',function(){//编译ES6并且压缩
    return gulp.src(['src/js/*.js', '!src/js/*.min.js'])
    // .pipe(jshint())//检查代码
    .pipe(babel({//编译ES6
        presets: ['es2015']
    }))
    .pipe(uglify({
        mangle: true,//类型：Boolean 默认：true 是否修改变量名
        compress: {
            drop_console: true,
            drop_debugger: true
        },
        warnings: true,
        toplevel: true // 去掉未使用的变量和函数
    }))
    // .pipe(rename({suffix:'.min'}))
    .pipe(rev())
    .pipe(gulp.dest('dist/js'))
    .pipe(rev.manifest('rev-js-manifest.json'))
    .pipe(gulp.dest('dist/rev/js'))
    .pipe(connect.reload());
})
gulp.task('rev', function() {
    return gulp.src(['dist/rev/**/*.json', 'src/*.html'])
        .pipe(revCollector({
            replaceReved: true,//允许替换, 已经被替换过的文件
            dirReplacements: {
                'scss': 'scss',
                'js': 'js'
            }
        }))
        .pipe(minifyHtml({
            empty: true,
            spare: true
        }))
        .pipe(gulp.dest('dist'))
        .pipe(connect.reload());//更新
});

gulp.task('fonts', function() {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'))
})

gulp.task('copy', function () {
    return gulp.src('src/js/*.min.js')
    .pipe(gulp.dest('dist/js'))
})

gulp.task('clean:dist', function() {//删除之前生成的文件
    return del(['dist']);
});

gulp.task('connect:dist',function(cb){
    connect.server({
        root:'dist',//根目录
        host:'192.168.6.169',//默认localhost:8080
        livereload:true,//自动更新
        port:9999//端口
    })
    cb()//执行回调，表示这个异步任务已经完成，起通作用,这样会执行下个任务
})

gulp.task('watchs',function(){//监听变化执行任务
    //当匹配任务变化才执行相应任务
    gulp.watch('src/scss/**/*.scss',gulp.series(['css', 'rev']));
    gulp.watch('src/js/**/*.js',gulp.series(['js', 'rev']));
    gulp.watch('src/fonts/**/*',gulp.series('fonts'));
    gulp.watch('src/images/**/*',gulp.series('images'));
    gulp.watch('src/*.html',gulp.series('rev'));

})
gulp.task('init',gulp.parallel(gulp.series('fonts', 'css', 'js', 'images', 'rev'), 'copy'));
gulp.task('build',gulp.series('clean:dist', 'init'));
gulp.task('serve',gulp.series('connect:dist','build','watchs'));