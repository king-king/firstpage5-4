/**
 * Created by 白 on 2015/7/16.
 */

library( function () {
	var css = imports( "css" ),
		object = imports( "object" ),
		async = imports( "async" );

	// 单选
	function Select( arg ) {
		var curSelected = null;

		return {
			Option : function ( element ) {
				var selectEvent = async.Event();
				css( element, arg.unselected );

				return object.insert( element, {
					select : function () {
						if ( curSelected !== element ) {
							if ( curSelected ) {
								css( curSelected, arg.unselected );
								curSelected.selected = false;
							}
							element.selected = false;
							css( curSelected = element, arg.selected );
							selectEvent.trig();
						}
					},
					onSelect : selectEvent.regist
				} );
			}
		};
	}

	function State( el, style, curState ) {
		function cut( state ) {
			css( el, style[state] );
		}

		cut( curState );
		return cut;
	}

	exports.Select = Select;
	exports.State = State;
} );