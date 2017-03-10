'use strict';

let gulp = require("gulp");
let babel = require("gulp-babel");



gulp.task("babel",() => {
	gulp.src("./src/**/*.js").pipe(babel())
	.on("error",(e) => {
		console.error(e);
	})
	.pipe(gulp.dest("./build/"))

});


gulp.task("default",["babel"], () => {
	gulp.watch("./src/**/*.js",["babel"]);
});

