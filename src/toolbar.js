/**
 * Created by 白 on 2015/8/31.
 */

library( function () {
	var $ = imports( "element" ),
		object = imports( "object" ),
		array = imports( "array" ),
		css = imports( "css" ),
		Img = imports( "./img" ),
		ui = imports( "./ui" ),
		env = imports( "./env" ),
		social = imports( "./social" ),
		makeCommentPage = imports( "./comment" ),
		makeLikePage = imports( "./like" ),
		commentPage = env.registLoginPage( "comment", social, makeCommentPage ),
		likePage = env.registLoginPage( "like", social, makeLikePage );

	module.exports = function ( workBody ) {
		var toolbar = $( "div", {
				css : {
					position : "absolute",
					height : 0,
					bottom : 0,
					right : 0,
					width : 0,
					"z-index" : "100"
				}
			}, workBody ), // 评论条
			workData = workBody.workData,
			workId = workBody.workId,
			oComment = ToolbarIcon( Img.Icon( "comment" ), 3 ), // 评论
			oLike = ToolbarIcon( Img.Icon( "like" ), 2 ), // 赞
			oMore = ToolbarIcon( Img.Icon( "more" ), 1 ); // 更多

		// 工具条图标
		function ToolbarIcon( contentIcon, i ) {
			var icon;
			return icon = object.insert( $( "div", {
				css : {
					position : "absolute",
					height : "32px",
					width : "32px",
					top : 0,
					right : "15px",
					transition : "0.25s ease-in-out",
					background : "rgba(0,0,0,0.88)",
					"border-radius" : "16px"
				},
				children : [
					$( "div", {
						css : {
							position : "absolute",
							left : "-14px",
							top : "-8px",
							right : "-14px",
							bottom : "-7px"
						}
					} ),
					$( contentIcon, {
						css : {
							position : "absolute",
							left : "50%",
							top : "50%",
							transform : "translate3d(-50%,-50%,0)"
						}
					} )
				]
			}, toolbar ), {
				show : function ( val ) {
					css.transform( icon, css.translate( 0, val ? -( ( 15 + 32 ) * i - 5 ) : 0, 0 ) );
				}
			} );
		}

		// 显示工具条
		function show( val ) {
			array.foreach( [oComment, oLike, oMore], function ( o ) {
				o.show( val );
			} );
			toolbar.showed = val;
		}

		// 评论
		ui.onTap( oComment, function () {
			commentPage( {
				data : workId,
				parent : workBody,
				force : true
			} );
		} );

		// 赞
		ui.onTap( oLike, function () {
			likePage( {
				data : workId,
				parent : workBody,
				force : true
			} );
		} );

		// 更多
		ui.onTap( oMore, function () {
			var background = $( "div", {
					css : css.full( {
						transition : "0.2s",
						background : "rgba(0,0,0,0.88)",
						"z-index" : 10
					} )
				}, document.body ),
				bottomBar = $( "div", {
					css : {
						transition : "0.2s",
						position : "absolute",
						bottom : 0,
						left : 0,
						right : 0,
						"z-index" : 11
					}
				}, document.body ),
				toolSection = Section(),
				cancelSection = Section();

			function Section() {
				return $( "div", {
					css : {
						margin : "0 7px 6px 7px",
						"font-size" : "18px",
						"color" : "#0172fe",
						background : "rgba(255,255,255,0.94)",
						"border-radius" : "4px"
					}
				}, bottomBar );
			}

			function Button( text, parent, color ) {
				return $( "div", {
					css : {
						"line-height" : "44px",
						color : color ? color : "inherit",
						"text-align" : "center",
						"border-top" : parent.firstElementChild ? "1px solid black" : "none"
					},
					innerHTML : text
				}, parent );
			}

			function show( val ) {
				if ( val ) {
					css( background, "opacity", 1 );
					css( bottomBar, "transform", "translate3d(0,0,0)" );
				}
				else {
					css( background, "opacity", 0 );
					css( bottomBar, "transform", "translate3d(0,100%,0)" );
				}
			}

			function cancel() {
				var lock = ui.Lock();
				show( false );
				setTimeout( function () {
					$.remove( background );
					$.remove( bottomBar );
					lock.remove();
				}, 250 );
			}

			ui.onTap( Button( "关注作者", toolSection ), function () {
				env.follow( workData.uid );
			} );
			ui.onTap( Button( "在初页APP中打开", toolSection ), function () {
				env.openInClient( workId, workData.uid );
			} );
			ui.onTap( Button( "举报", toolSection, "#fe2454" ), function () {
				env.report( workId );
			} );

			ui.onTap( Button( "取消", cancelSection ), cancel );
			ui.onTap( background, cancel );

			show( false );

			setTimeout( function () {
				show( true );
			}, 20 );
		} );

		return object.insert( toolbar, {
			show : show,
			prepare : function () {
				social.getIndex( workId, function ( err, result ) {
					if ( err == null ) {
						function ToolNumber( number, parent, className ) {
							return $( "div", {
								classList : className,
								css : {
									display : "inline-block",
									position : "absolute",
									top : 0,
									left : "50%",
									height : "11px",
									"line-height" : "11px",
									"font-size" : "9px",
									"min-width" : "11px",
									transform : "translate3d(-50%,0,0)",
									"border-radius" : "6px",
									background : "#fe2e54",
									color : "white",
									padding : "0 2px",
									"text-align" : "center"
								},
								innerHTML : number
							}, $( "div", {
								css : {
									position : "absolute",
									top : 0,
									right : 0,
									width : 0,
									"border-radius" : "6px"
								}
							}, parent ) );
						}

						ToolNumber( result.Text, oComment, "comment" );
						ToolNumber( result.Like, oLike, "like" );
					}
				} );

				setTimeout( function () {
					show( true );
				}, 20 );
			}
		} );
	};
} );