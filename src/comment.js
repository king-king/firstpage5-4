/**
 * Created by 白 on 2015/7/30.
 */

library( function () {
	var social = imports( "./social" ),
		array = imports( "array" ),
		$ = imports( "element" ),
		css = imports( "css" ),
		img = imports( "./img" ),
		ui = imports( "./ui" ),
		tips = imports( "./tips" ),
		string = imports( "string" ),
		async = imports( "async" ),
		object = imports( "object" );

	css.insertRules( {
		".placeholder-8e9193::-webkit-input-placeholder" : {
			color : "#8e9193"
		}
	} );

	module.exports = function ( page, workId ) {
		var inBlur = false,
			me = null,
			replyTo = null,
			loading = $( tips.Loading(), page ),
			oListContent = $( "div.scroll.hidden", {
				css : {
					position : "absolute",
					top : "54px",
					left : 0,
					right : 0,
					bottom : "54px"
				}
			}, page ),
			footBar = $( "div.hidden", {
				css : {
					position : "absolute",
					"border-top" : "1px solid #606060",
					left : 0,
					right : 0,
					bottom : "0",
					background : "black"
				}
			}, page ),
			lastCommentId = null,
			oLoadingMore = false,
			loadingMore = false,
			oSend = $( "div", {
				css : {
					position : "absolute",
					border : "1px #fe2454 solid",
					background : "rgba(254,36,84,0.25)",
					width : "51px",
					height : "26px",
					right : "10px",
					top : "50%",
					"margin-top" : "-13px",
					"border-radius" : "13px",
					"line-height" : "26px",
					"font-size" : "13px",
					"text-align" : "center",
					color : "white",
					cursor : "pointer"
				},
				innerHTML : "发送",
				children : [$( "div", {
					css : {
						position : "absolute",
						left : "-15px",
						right : "-10px",
						top : "-13px",
						bottom : "-13px"
					}
				} )]
			}, footBar ),
			textBoxForm = $( "form", {
				css : {
					margin : "20px 71px 20px 55px"
				}
			}, footBar ),
			textBox = $( "textarea.placeholder-8e9193", {
				css : {
					display : "block",
					height : "14px",
					"line-height" : "14px",
					"font-size" : "14px",
					width : "100%",
					background : "transparent",
					color : "white",
					resize : "none"
				},
				placeholder : "说点什么..."
			}, textBoxForm );

		$( page, {
			css : {
				background : "rgba(0,0,0,0.88)"
			},
			classList : "need-default"
		} );


		$( img.Icon( "comment/close" ), {
			css : {
				position : "absolute",
				right : "15px",
				top : "15px"
			}
		}, page );

		ui.onTap( $( "div", {
			css : {
				position : "absolute",
				right : 0,
				top : 0,
				width : "50px",
				height : "50px"
			}
		}, page ), function () {
			page.slideOut();
		} );

		function Avatar( url ) {
			return $( "div", {
				css : {
					position : "absolute",
					width : "30px",
					height : "30px",
					background : css.url( url ),
					"background-size" : "cover",
					"background-position" : "50% 50%",
					"border-radius" : "15px"
				}
			} );
		}

		// 在评论列表里添加一个评论
		function addOComment( comment, inFirst ) {
			var user = comment.User,
				replyUser = comment.ReplyUser,
				wrapper = $( "div", {
					css : {
						position : "relative"
					}
				} ),
				rightBar = $( "div", {
					css : {
						position : "relative",
						"margin-left" : "55px",
						"margin-right" : "15px",
						"border-top" : oListContent.firstElementChild === wrapper ? "1px solid #606060" : "none",
						"border-bottom" : "1px solid #606060"
					},
					children : [$( "div", {
						css : {
							position : "absolute",
							right : "-15px",
							top : 0,
							bottom : 0,
							width : "15px"
						}
					} )]
				}, wrapper ),
				oReply = replyUser ? ["回复", $( "span", {
					innerHTML : replyUser.Nickname,
					css : {
						"margin-left" : "5px",
						color : "#8e9193"
					}
				} ).outerHTML, "："].join( "" ) : "",
				createAt = new Date( comment.CreateAt ),
				now = new Date(),
				diff = ( now - createAt ) / 1000 / 60 << 0,
				dateString = "",
				timeString = "";

			// 头像
			$( Avatar( user.HeadPhoto ), {
				css : {
					top : "6px",
					left : "15px"
				}
			}, wrapper );

			// 回复图标
			$( img.Icon( "comment/reply" ), {
				css : {
					position : "absolute",
					top : "12px",
					right : "20px",
					"pointer-events" : "none"
				}
			}, wrapper );

			$( "div", {
				innerHTML : user.Nickname,
				css : {
					"padding-top" : "8px",
					"font-size" : "14px",
					"line-height" : "14px",
					color : "#8e9193"
				}
			}, rightBar );

			// 一分钟内
			if ( diff < 1 ) {
				timeString = "刚刚";
			}
			else if ( diff < 60 ) {
				timeString = diff + "分钟前";
			}
			else {
				function patch( i ) {
					return i < 10 ? "0" + i : i;
				}

				timeString = string.format( "%h%:%m%", {
					h : createAt.getHours(),
					m : patch( createAt.getMinutes() )
				} );

				if ( createAt.getYear() === now.getYear() && createAt.getMonth() === now.getMonth() && createAt.getDate() === now.getDate() ) {
					dateString = "今天";
				}
				else {
					dateString = string.format( "%y%/%m%/%d%", {
						y : createAt.getFullYear(),
						m : patch( createAt.getMonth() + 1 ),
						d : patch( createAt.getDate() )
					} );
				}
			}

			$( "div", {
				innerHTML : [dateString, timeString].join( " " ),
				css : {
					"margin-top" : "6px",
					"font-size" : "10px",
					"line-height" : "10px",
					color : "#8e9193"
				}
			}, rightBar );

			$( "div", {
				innerHTML : oReply + comment.Content,
				css : {
					"margin" : "8px 0",
					"font-size" : "14px",
					"line-height" : "20px",
					color : "white"
				}
			}, rightBar );

			oListContent.insertBefore( wrapper, inFirst ? oListContent.firstElementChild : null );

			lastCommentId = comment.Id;

			// 点击回复
			ui.onTap( rightBar, function () {
				if ( !inBlur && me.Id !== user.Id ) {
					replyTo = user.Id;
					textBox.placeholder = "回复 " + user.Nickname + "：";
					textBox.focus();
				}
			} );
		}

		// 加载评论
		function loadComment( callback ) {
			social.request( "api/Comment/Index", object.extend( {
				relateId : workId
			}, oLoadingMore ? {
				lastId : lastCommentId
			} : {} ), function ( err, commentList ) {
				$.remove( oLoadingMore );
				array.foreach( commentList, function ( comment ) {
					addOComment( comment );
				} );
				oLoadingMore = commentList.length === 15 ? $( "div", {
					css : {
						margin : "15px 0",
						"text-align" : "center",
						height : "9px"
					},
					children : [
						$( tips.LoadingChrysanthemum(), {
							css : {
								width : "9px",
								height : "9px"
							}
						} ),
						$( "div", {
							css : {
								display : "inline-block",
								"vertical-align" : "top",
								"font-size" : "9px",
								"line-height" : "9px",
								"margin-left" : "5px",
								color : "#8e9193"
							},
							innerHTML : "加载中..."
						} )
					]
				}, oListContent ) : null;
				callback && callback();
			}, true );
		}

		// 发表评论
		function addComment() {
			if ( oSend.classList.contains( "hidden" ) ) {
				return;
			}

			if ( textBox.value !== "" ) {
				var loading = $( "div", {
					css : {
						position : "absolute",
						border : "1px solid",
						width : "51px",
						height : "26px",
						right : "10px",
						top : "50%",
						"margin-top" : "-13px"
					},
					children : [tips.LoadingButton()]
				}, footBar );
				oSend.classList.add( "hidden" );

				social.request( "api/Comment/Add", object.extend( {
					RelateId : workId,
					Type : 0,
					Content : textBox.value
				}, replyTo ? {
					ReplyUserId : replyTo
				} : {} ), function ( err, data ) {
					if ( err == null ) {
						addOComment( data, true );
						textBox.value = "";
						textBox.blur();
						adjustTextBox();
						oListContent.scrollTop = 0;

						var oOutCommentNumber = page.parentNode ? page.parentNode.querySelector( ".comment" ) : null;
						if ( oOutCommentNumber ) {
							oOutCommentNumber.innerHTML = parseInt( oOutCommentNumber.innerHTML ) + 1;
						}
					}
					else {
						ui.alert( "出错了,请重试" );
					}
					oSend.classList.remove( "hidden" );
					$.remove( loading );
				} );
			}
		}

		// 调整输入框的尺寸
		function adjustTextBox() {
			css( textBox, "height", "14px" );
			css( textBox, "height", css.px( textBox.scrollHeight ) );
		}

		// 点击列表失去焦点
		ui.onPointerDown( oListContent, function () {
			if ( document.body.classList.contains( "focus" ) ) {
				inBlur = true;
				textBox.blur();
			}
		} );
		ui.onPointerUp( page, function () {
			inBlur = false;
		} );

		// 失去焦点时取消回复
		$.bind( textBox, "blur", function () {
			replyTo = null;
			textBox.placeholder = "说点什么...";
		} );

		// 输入时调整文本框
		$.bind( textBox, "input", adjustTextBox );

		// 点击发送时不失去焦点
		ui.onPointerDown( oSend, function ( event ) {
			event.preventDefault();
		} );

		// 发表评论
		ui.onTap( oSend, addComment );
		$.bind( textBoxForm, "submit", function ( event ) {
			event.preventDefault();
			addComment();
		} );

		// 滚动加载
		$.bind( oListContent, "scroll", function () {
			if ( !loadingMore && oLoadingMore && oListContent.scrollHeight - oListContent.scrollTop - oListContent.clientHeight < 39 ) {
				loadingMore = true;
				loadComment( function () {
					loadingMore = false;
				} );
			}
		} );

		async.concurrency( [
			loadComment,
			function ( callback ) {
				social.getUserInfo( function ( err, data ) {
					me = data.User;
					$( Avatar( me.HeadPhoto ), {
						css : {
							left : "15px",
							top : "50%",
							"margin-top" : "-15px"
						}
					}, footBar );
					callback();
				}, true );
			}
		], function () {
			$.remove( loading );
			oListContent.classList.remove( "hidden" );
			footBar.classList.remove( "hidden" );
		} );
	};
} );