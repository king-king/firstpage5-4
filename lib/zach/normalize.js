/**
 * Created by 白 on 2015/9/10.
 */

library( function () {
	var css = imports( "css" );

	css.insertRules( "*", {
		"padding" : "0",
		"margin" : "0",
		"outline" : "none",
		"border" : "none"
	} );

	exports.lock = function () {
		css.insertRules( ".lock, .lock *, .lock-children *", {
			"pointer-events" : "none !important"
		} );
	};

	exports.hidden = function () {
		css.insertRules( ".hidden, .hidden *", {
			visibility : "hidden !important"
		} );
	};
} );