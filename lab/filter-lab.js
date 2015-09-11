/**
 * Created by 白 on 2015/9/10.
 */

main( function () {
	var lab = imports( "./lab" ),
		$ = imports( "element" ),

		body = document.body,
		table = $( "table", {
			css : {
				width : "100%",
				height : "100%"
			}
		}, body ),
		tr = $( "tr", table );

	function Column() {
		return $( "td", {
			css : {
				height : "100%"
			}
		}, table );
	}


} );