/**
 * Created by 白 on 2015/8/14.
 * 动画数据
 */

library( function () {
	var object = imports( "object" ),
		random = imports( "random" ),
		array = imports( "array" ),
		Layout = imports( "./layout" ),
		sa = imports( "./switch-animation" ),
		ea = imports( "./enter-animation" ),
		ua = imports( "./ua" ),
		pageAnimationData = imports( "./page-animation.json" ),
		marshall = pageAnimationData.marshall,
		pageAnimations = object.collect( function ( push ) {
			object.foreach( pageAnimationData.group, function ( id, g ) {
				function Marshall( id ) {
					return Group( array.map( marshall[id], function ( id ) {
						return ea.table[id];
					} ) );
				}

				push( id, {
					seed : 0,
					name : g.n,
					speed : g.s,
					inOrder : g.o,
					imageGroup : Marshall( g.i ),
					textGroup : Marshall( g.t )
				} );
			} );
		} ),

		bounce = Group( [DirectionGroup( ea.BounceFlying ), ea.bounceIn] ),
		swing = Group( [ea.swing] ),
		flipIn = Group( [ea.FlipIn( "x" ), ea.FlipIn( "y" )] ),
		shake = Group( [ea.shake, ea.wobble] ),
		fall = Group( [ea.fallDownAndShake] ),
		tada = Group( [ea.tada] ),
		rubberBand = Group( [ea.rubberBand] ),
		rotateIn = Group( [DirectionGroup( ea.RotateIn )] ),
		zoomIn = Group( [DirectionGroup( ea.ZoomIn )] ),
		lightSpeedIn = Group( [DirectionGroup( ea.LightSpeedIn )] ),
		wave = Group( DirectionGroup( ea.Wave, [1, 3] ) ),
		creep = Group( DirectionGroup( ea.Creep, [0, 2] ) ),
		circleRound = Group( [ea.circleRound] ),
		coin = Group( [ea.coin] ),
		emerge = Group( [DirectionGroup( ea.Emerge ), ea.fadeIn] ),
		overturn = Group( [ea.overturn] ),
		shrink = Group( [ea.shrink] ),
		scale = Group( [ea.scale] ),
		flyInto = Group( DirectionGroup( ea.FlyInto ) ),
		flyIntoX = Group( DirectionGroup( ea.FlyInto, [1, 3] ) ),
		roundFromFarAndNear = Group( [ea.roundFromFarAndNear] );

	// 方向动画组
	function DirectionGroup( AnimationGen, directions ) {
		return array.map( directions || array.range( 4 ), function ( direction ) {
			return AnimationGen( direction );
		} );
	}

	// 动画组
	function Group( group ) {
		var result = [];
		array.foreach( group, function ( group ) {
			result = result.concat( group );
		} );
		array.foreach( result, function ( enter ) {
			result.isEmphasize = Layout.isEmphasize( enter );
			result.isScale = enter.scale;
			result.isPerspective = Layout.isPerspective( enter );
		} );
		return result;
	}

	// 获取速度
	function Speed( themeNumber ) {
		return {
			1 : [0.8, 0.1, 0.8, 0.1, 0.8, 0.1],
			2 : [0.7, 0.1, 0.7, 0.1, 0.7, 0.1],
			3 : [1.2, 0.3, 1.2, 0.1, 1.2, 0.3],
			4 : [1.4, 0.3, 1.4, 0.1, 1.4, 0.3],
			5 : [0.8, 0.3, 0.8, 0.1, 0.8, 0.1],
			6 : [1.6, 0.6, 1.4, 0.1, 1.6, 0.3],
			7 : [1.6, 0.5, 1.4, 0.3, 1.6, 0.1],
			8 : [1.6, 0.3, 1.6, 0.1, 1.6, 0.3]
		}[themeNumber];
	}

	// 选择主题
	function Theme( workData ) {
		var themeNumber = workData.theme,
			workRandom = random.Random( parseInt( workData.id ) ),
			seedRandom = random.Random( parseInt( workData.id ) ),
			switchAnimations = {
				1 : [sa.classic, sa.flipOver, sa.push],
				2 : [sa.fade, sa.classic, sa.door, sa.overturn, sa["switch"]],
				3 : [sa.classic, sa.push, sa.overturn],
				4 : [sa.classic, sa.uncover, sa.push, sa["switch"], sa.fade],
				5 : [sa.classic, sa.fade, sa.push],
				6 : [sa.classic, sa.fade, sa.push],
				7 : [sa.classic, sa.fade, sa.push],
				8 : [sa.classic, sa.uncover, sa.fade]
			}[themeNumber],
			switchAnimation = workRandom.select( ua.iphone6 ? array.remove( switchAnimations, function ( a ) {
				return a.highPerformance;
			} ) : switchAnimations ),
			lastTextGroups = [], lastImageGroups = [],
			appliedGroup = {};

		array.foreach( workData.pages, function ( pageData, pageIndex ) {
			var typeCount = {
					image : 0,
					text : 0
				},
				noScale = false;

			if ( pageData.label === "custom-2" || pageData.label === "screen" || pageData.name === "screen" ) {
				array.foreach( pageData.image, function ( image ) {
					var imageInfo = image.imageinfo;
					if ( imageInfo ) {
						var type = imageInfo.type;
						if ( type in typeCount ) {
							typeCount[type]++;
						}

						noScale = noScale || !!image.mask || imageInfo.borderWidth > 0 || imageInfo.maskRadius > 0;
					}
				} );

				var allImage = typeCount.text === 0, // 全是图
					pureText = typeCount.image === 0, // 纯文本
					singleImage = typeCount.image === 1, // 只有一张图
					lessImage = pureText || singleImage, // 没有图或只有一张图

					imageGroupList = [], textGroupList = [], allGroupList = [], // 动画组
					imageGroup, textGroup,
					inOrder = null; // 速度

				// 根据主题设置速度和动画组
				({
					// 萌萌哒
					1 : function () {
						if ( lessImage ) {
							imageGroupList = [shake, tada, rubberBand];
							allGroupList = [bounce, flipIn, swing, fall];
						}
						else {
							imageGroupList = [shake, tada, rubberBand];
							allGroupList = [bounce, flipIn, fall]
						}
					},

					// 逗比
					2 : function () {
						var lessImageResult = {
								image : [shake, tada, lightSpeedIn, coin],
								text : [lightSpeedIn, flyIntoX]
							},
							result = lessImage ? lessImageResult : workRandom.select( [
								lessImageResult,
								{
									image : [flyInto],
									text : [lightSpeedIn, creep, wave, coin]
								}
							] );
						imageGroupList = result.image;
						textGroupList = result.text;
					},

					// 小清新
					3 : function () {
						allGroupList = lessImage ? [bounce, flipIn, swing, rotateIn, emerge, flyInto, overturn, roundFromFarAndNear]
							: [bounce, rotateIn, flyInto, emerge];
					},

					// 文艺
					4 : function () {
						allGroupList = lessImage ? [flipIn, rotateIn, emerge, scale, roundFromFarAndNear, flyInto, overturn] :
							[flipIn, rotateIn, emerge, scale, flyInto];
					},

					// 大气
					5 : function () {
						var flyEmerge;

						if ( lessImage ) {
							textGroupList = imageGroupList = [overturn, shrink, scale, roundFromFarAndNear, zoomIn];
						}
						else {
							textGroupList = [circleRound, roundFromFarAndNear, overturn, scale, zoomIn];
							imageGroupList = [overturn, scale, zoomIn];
						}

						// 要不然图有飞入,有不然文字有飞入
						flyEmerge = random.select( [textGroupList, imageGroupList] );
						flyEmerge.push( flyInto, emerge );

						// 第一页必有缩放
						if ( pageIndex === 0 ) {
							pureText ? textGroupList = [shrink] : imageGroupList = [shrink];
						}
					},

					// 历史
					6 : function () {
						allGroupList = lessImage ? [flipIn, rotateIn, emerge, overturn, scale, flyInto, overturn] :
							[rotateIn, emerge, overturn, scale, flyInto, roundFromFarAndNear];

						if ( typeCount.image >= 5 ) {
							inOrder = false;
						}
					},

					// 简约
					7 : function () {
						textGroupList = [overturn];

						if ( lessImage ) {
							allGroupList = [flipIn, rotateIn, emerge, scale, flyInto, roundFromFarAndNear];
						}
						else {
							allGroupList = [rotateIn, emerge, scale, flyInto];
						}
					},

					// 精致
					8 : function () {
						if ( lessImage ) {
							allGroupList = [flipIn, rotateIn, emerge, flyInto, roundFromFarAndNear, overturn];
						}
						else {
							textGroupList = [overturn];
							allGroupList = [rotateIn, emerge, flyInto];
						}
					}
				}[themeNumber])();

				imageGroupList = imageGroupList.concat( allGroupList );
				textGroupList = textGroupList.concat( allGroupList );

				// mask元素不会分配缩放动画
				if ( noScale ) {
					imageGroupList = array.remove( imageGroupList, function ( animationGroup ) {
						return animationGroup.isScale;
					} );
				}

				function selectGroup( groups, lastGroups ) {
					var remindGroups = array.remove( groups, function ( group ) {
							return group === lastGroups[0] || group === lastGroups[1];
						} ),
						selectedGroup = workRandom.select( remindGroups.length === 0 ? groups : remindGroups );

					lastGroups.push( selectedGroup );
					if ( lastGroups.length >= 3 ) {
						lastGroups.shift();
					}
					return selectedGroup;
				}

				// 如果是纯图,这些图不是强调动画
				imageGroup = selectGroup( allImage ? array.filter( imageGroupList, function ( g ) {
					return !g.isEmphasize;
				} ) : imageGroupList, lastImageGroups );

				// 如果图片不是强调的,文字也不是强调的
				textGroup = selectGroup( allImage || !imageGroup.isEmphasize ? array.filter( textGroupList, function ( g ) {
					return !g.isEmphasize;
				} ) : textGroupList, lastTextGroups );

				appliedGroup[pageIndex] = {
					seed : seedRandom(),
					imageGroup : imageGroup,
					textGroup : textGroup,
					inOrder : inOrder,
					speed : Speed( themeNumber )
				};
			}
		} );

		return {
			switchAnimation : switchAnimation,
			themeNumber : themeNumber,
			appliedGroup : appliedGroup
		};
	}

	exports.Theme = Theme;
	exports.Speed = Speed;
	exports.pageAnimations = pageAnimations;
} );
