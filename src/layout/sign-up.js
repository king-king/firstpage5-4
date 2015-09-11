/**
 * Created by 白 on 2014/9/15.
 * 按钮相关板式
 */

plugin( function () {
	var array = imports( "array" ),
		$ = imports( "element" ),
		async = imports( "async" ),
		object = imports( "object" ),
		pointer = imports( "pointer" ),
		css = imports( "css" ),
		ajax = imports( "ajax" ),
		URL = imports( "url" ),

		storage = imports( "../storage" ),
		Img = imports( "../img" ),
		env = imports( "../env" ),
		main = imports( "../main" ),
		tips = imports( "../tips" ),
		ua = imports( "../ua" ),
		ui = imports( "../ui" ),
		util = imports( "../util" ),
		Layout = imports( "../layout" ),
		Content = imports( "../content" ),
		p = imports( "../position" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats,

		href = URL( location.href ),
		userInfo = null,
		SignupSystem = {},
		token,
		getUserInfo;

	// 调用初夜接口
	function invokeApi( op ) {
		return ajax( {
			method : "post",
			url : URL.concatArg( "http://c.cloud7.com.cn" + op.url, token ? {
				_token : token
			} : {} ),
			data : object.is.String( op.data ) ? op.data : URL.encodeObject( op.data ),
			headers : object.extend( {
				"Accept" : "application/json",
				"Content-Type" : "application/x-www-form-urlencoded"
			}, op.headers || {} )
		}, function ( err, xhr ) {
			var data = JSON.parse( xhr.responseText );
			if ( data.code === 302 ) {
				op.on302 && op.on302( data.data );
			}
			else {
				op.success( data.data );
			}
		} );
	}

	if ( !ua.MicroMessenger ) {
		SignupSystem.canNotLogin = function () {
			alert( "请在微信中使用" );
		};

		SignupSystem.isLogIn = function () {
			return false;
		};
	}
	else {
		// 如果参数中有token,说明刚登陆完
		if ( token = href.arg._token ) {
			storage.setItem( "token", token, 7 * 24 * 60 * 60 );

			// 获取用户信息
			getUserInfo = function ( callback ) {
				if ( userInfo ) {
					callback( userInfo );
				}
				else {
					invokeApi( {
						url : "/api/Wechat/CurrentUser",
						success : function ( data ) {
							callback( userInfo = data );
						}
					} );
				}
			};

			SignupSystem.isLogIn = function () {
				return true;
			};
		}
		// 否则从localStorage中获取值,此值可能过期,用getUserInfo来确保它已登陆上
		else {
			token = storage.getItem( "token" );
			
			// 获取用户信息
			getUserInfo = function ( callback ) {
				callback( userInfo );
			};

			SignupSystem.isLogIn = function () {
				return userInfo !== null;
			};

			// 如果有token,立即发起一次获取CurrentUser的请求,以判断是否过期
			if ( token ) {
				var on302 = null,
					onSuccess = null;

				invokeApi( {
					url : "/api/Wechat/CurrentUser",
					on302 : function ( url ) {
						on302 && on302( url );

						SignupSystem.logIn = function () {
							invokeApi( {
								url : "/api/Wechat/CurrentUser",
								on302 : env.jump
							} );
						};
					},
					success : function ( data ) {
						userInfo = data;
						onSuccess && onSuccess();
					}
				} );

				SignupSystem.logIn = function ( arg ) {
					if ( userInfo ) {
						arg.onLogIn();
					}
					else {
						on302 = env.jump;
						onSuccess = arg.onLogIn;
					}
				};
			}
			// 如果没有token,login就是直接跳转
			else {
				SignupSystem.logIn = function () {
					location.href = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx9d492ee399e6a24c&redirect_uri=' +
						encodeURIComponent( 'http://c.cloud7.com.cn/Auth?returnUrl=' +
							encodeURIComponent( location.href ) ) +
						'&response_type=code&scope=snsapi_base&state=#wechat_redirect';
				};
			}
		}
	}

	layoutFormats["Sign-Up02"] = {
		create : function ( layout, ds ) {
			var l = util.layout504( layout, ds.image( 0 ) ),
				yList = {
					top : 148,
					middle : 417,
					bottom : 687
				},
				buttonSize = 125 * l.scale << 0;

			var button = Component( Content.Rect( buttonSize, buttonSize ), layout );
			button.x = p.center( button, layout );
			button.y = l.y( yList[ds.position( 0 )] / 2 );

			ui.onTap( button.element, function () {
				env.jump( ds.actionlinks( 0 ) );
			} );
		}
	};

	// 报名表单页
	var signUpPage = env.registLoginPage( "sign-up", SignupSystem, function ( page, formInfo ) {
		var formTemplate = formInfo.template, // 表单模板
			pageContent = $( "div", {
				css : {
					padding : "0 25px"
				},
				children : [$( "div", {
					css : {
						color : "#99a2a7",
						"font-size" : "12px",
						"line-height" : "12px",
						"margin-top" : "27px"
					},
					innerHTML : "'请您填写报名表单，谢谢您的参与！'"
				} )]
			}, page ), // 报名页的内容部分
			form = $( "form", {
				action : "/"
			}, pageContent ),
			curFocus = null,
			lastInput = null,
			inputList = [], // 输入列表
			hideField = {}; // 隐藏字段

		$( Img.Icon( "signup/close" ), {
			css : {
				position : "absolute",
				right : "7px",
				top : "7px"
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

		css( page, {
			background : "rgba(255, 255, 255, 0.96)"
		} );

		page.classList.add( "scroll" );
		page.classList.add( "need-default" );

		// 提交表单
		function submit() {
			var formData = [], unfilled = [];
			curFocus && curFocus.blur();

			function pushField( component, value ) {
				formData.push( {
					name : component.name,
					label : component.label,
					value : value
				} );
			}

			// 收集输入字段
			var errors = [];
			array.foreach( inputList, function ( item ) {
				var value = item.input.value;
				// 如果是必填字段,检查是否为空,若为空,添加到未填数组中
				if ( item.data.required ) {
					if ( value === "" ) {
						unfilled.push( item.data.label );
						item.input.toState( "error" );
					}
					else {
						var validateInfo = item.validate ? item.validate( value ) : null;
						if ( validateInfo ) {
							errors.push( validateInfo );
							item.input.toState( "error" );
						}
						else {
							pushField( item.data, value );
							item.input.toState( "normal" );
						}
					}
				}
				else {
					pushField( item.data, item.input.value );
				}
			} );

			// 如果未填数组不为空,提示
			if ( unfilled.length !== 0 || errors.length !== 0 ) {
				alert( ( unfilled.length ? [unfilled.join( "，" ) + "不能为空。"] : [] ).concat( errors ).join( "<br>" ) );
			}
			else {
				var task = [],
					loading = tips.Loading( page ),
					userInfo = {};

				ui.Lock( pageContent );

				// 如果用户登录了,收集用户信息
				if ( SignupSystem.isLogIn() ) {
					task.push( function ( loadDone ) {
						getUserInfo( function ( data ) {
							userInfo = data;
							loadDone();
						} );
					} );
				}

				// 收集完信息后,整理数据,提交表单
				async.concurrency( task, function () {
					var hideData = {
						"报名时间" : new Date().getTime(),
						"微信昵称" : userInfo.NickName,
						"微信头像" : userInfo.HeadPhoto,
						"微信性别" : userInfo.Sex,
						"微信City" : userInfo.City,
						"微信Province" : userInfo.Province,
						"微信Country" : userInfo.Country
					};

					object.foreach( hideField, function ( name, item ) {
						pushField( item, hideData[name] === undefined ? "" : hideData[name] );
					} );

					// 发送提交表单请求
					ajax( {
						url : virtualPath + "/Integra/SaveData",
						method : "post",
						headers : {
							"Content-Type" : "application/x-www-form-urlencoded"
						},
						data : URL.encodeObject( {
							formid : formInfo.formId,
							data : JSON.stringify( formData )
						} )
					}, function () {
						$.remove( loading );

						// 弹出提示,1秒后移除页面
						alert( formTemplate.data.submitComplete.value );
						setTimeout( function () {
							if ( page.isIn ) {
								page.slideOut();
							}
						}, 1000 );
					} );
				} );
			}
		}

		$.bind( form, "submit", function ( event ) {
			event.preventDefault();
		} );

		array.foreach( formTemplate.data.component, function ( component ) {
			if ( component.enable ) {
				if ( component.visiable ) {
					// 显示字段
					switch ( component.name ) {
						case "textbox":
							// 文本框
							(function () {
								var wrapper = {},
									label = $( "label", {
										css : {
											position : "relative",
											"margin-bottom" : "13px",
											"margin-top" : form.firstElementChild ? "13px" : "21px",
											display : "block"
										}
									}, form ),
									caption = wrapper.caption = $( "div", {
										css : {
											"font-size" : "15px",
											"line-height" : "15px",
											color : "#4f5356"
										},
										innerHTML : component.label + "："
									}, label ), // 字段名
									input = wrapper.input = $.State( $( "input", {
										css : {
											height : "39px",
											"margin-top" : "6px",
											"font-size" : "15px",
											"line-height" : "37px",
											width : "100%",
											padding : "0 9px",
											"box-sizing" : "border-box",
											background : "transparent"
										},
										placeholder : component.placeholder,
										name : component.id
									}, label ), {
										normal : {
											border : "1px solid #4f5356"
										},
										error : {
											border : "1px solid #FC7A89"
										}
									}, "normal" );

								switch ( component.label ) {
									case "电话":
										input.type = "tel";
										break;
									case "邮箱":
										input.type = "email";
										wrapper.validate = function ( value ) {
											return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test( value ) ?
												null : "请输入正确的邮箱地址";
										};
										break;
								}

								// 获得焦点时,更新curFocus
								$.bind( input, "focus", function () {
									curFocus = input;
								} );

								// 如果是必填的,添加一个必填字段坐标
								if ( component.required ) {
									$( Img.Icon( "signup/star" ), {
										css : {
											display : "inline-block",
											width : "5px",
											height : "5px",
											"vertical-align" : "top"
										}
									}, caption );
								}

								// 如果有上一个input,按回车时更新到此焦点
								if ( lastInput ) {
									$.bind( lastInput, "keypress", function ( event ) {
										if ( event.keyCode === 13 ) {
											input.focus();
										}
									} );
								}

								lastInput = input;
								wrapper.data = component;
								inputList.push( wrapper );
							})();
							break;
						case "btn":
							// 按钮,目前一律视为提交按钮
							ui.onTap( $( "div", {
								css : {
									width : "115px",
									height : "38px",
									"line-height" : "38px",
									"font-size" : "15px",
									margin : "0 auto",
									background : "#FA6143",
									color : "white",
									"text-align" : "center",
									"border-radius" : "3px"
								},
								innerHTML : component.value
							}, $( "div", {
								css : {
									margin : "21px 0 13px 0"
								}
							}, form ) ), submit );
							break;
					}
				}
				else {
					hideField[component.label] = component;
				}
			}
		} );

		if ( lastInput ) {
			$.bind( lastInput, "keypress", function ( event ) {
				if ( event.keyCode === 13 ) {
					submit();
				}
			} );
		}
	} );

	layoutFormats["Sign-Up03"] = {
		create : function ( layout, ds ) {
			var l = util.layout504( layout, ds.image( 0 ) ),
				signup = object.extend( ds.signup, {} ),
				button = l.image( ds.image( 1 ), layout );

			button.x = p.center( button, layout );
			button.y = l.y( 208 );

			signup.template = JSON.parse( signup.template );

			ui.onTap( button.element, function () {
				signUpPage( {
					data : signup,
					noLog : !signup.template.allowAnymous,
					parent : layout.body
				} );
			} );
		}
	};
} );