/**
 * Created by 白 on 2015/8/14.
 */

library( function () {
	var object = imports( "object" ),
		z2d = imports( "2d" ),
		random = imports( "random" ),
		array = imports( "array" ),
		Layout = imports( "./layout" ),
		multiImage = imports( "./multi-image" );

	// 为一组组件添加速度
	function applySpeed( components, duration, delay, last ) {
		var lastEnter = null;
		last = last || 0;
		array.foreach( components, function ( comp, i ) {
			lastEnter = comp.enter = object.extend( comp.enter, {
				duration : duration + ( comp.enter.durationCorrect || 0 ),
				delay : delay * duration * i + last
			} );
		} );
		return lastEnter ? lastEnter.duration + lastEnter.delay : last;
	}

	// 分析页面
	function analyzePage( page ) {
		var layout = page.wrapper,
			enterComponentTable = {
				text : [],
				image : [],
				mulitimage : []
			};

		// 提取需要动画的元素,并根据类型计数
		Layout.loopComponent( layout, function ( component ) {
			var applyEnter = component.applyEnter || {},
				type = applyEnter.type;

			if ( type ) {
				enterComponentTable[type] = enterComponentTable[type] || [];
				enterComponentTable[type].push( component );
			}
		} );

		return enterComponentTable;
	}

	// 应用页面动画
	function applyAnimate( page, appliedGroup ) {
		var layout = page.wrapper,
			applyEnter = layout.applyEnter,
			enterComponentTable = analyzePage( page ),
			speed, pageRandom,
			last = 0;

		function applySpeedA( components, duration, delay ) {
			last = applySpeed( components, duration, delay, last );
		}

		if ( applyEnter && appliedGroup ) {
			pageRandom = random.Random( appliedGroup.seed );
			speed = appliedGroup.speed;

			// 分配动画
			array.foreach( [[enterComponentTable.image, appliedGroup.imageGroup], [enterComponentTable.text, appliedGroup.textGroup]], function ( arg ) {
				array.foreach( arg[0], function ( comp ) {
					var midPoint = z2d.transform( Layout.getPageMatrix( comp ), [comp.w / 2, comp.h / 2, 1] );
					comp.enter = pageRandom.select( array.remove( arg[1], function ( enter ) {
						return enter.direction === ( midPoint[1] + 1 >= layout.h / 2 ? 0 : 2 ) ||
							enter.direction === ( midPoint[0] + 1 >= layout.w / 2 ? 3 : 1 );
					} ) );
				} );
			} );

			// 有序
			if ( appliedGroup.inOrder === true || ( appliedGroup.inOrder == null && pageRandom() > 0.5 ) ) {
				if ( applyEnter.first === "text" ) {
					applySpeedA( enterComponentTable.text, speed[2], speed[3] );
					applySpeedA( enterComponentTable.image, speed[0], speed[1] );
				}
				else {
					applySpeedA( enterComponentTable.image, speed[0], speed[1] );
					applySpeedA( enterComponentTable.text, speed[2], speed[3] );
				}
			}
			// 无序
			else {
				var unorderedComponents = pageRandom.arrange( enterComponentTable.text.concat( enterComponentTable.image ) ),
					unorderedTexts = [], unorderedTextIndexes = [];

				// 调整文字顺序,保证标题总在最前
				array.foreach( unorderedComponents, function ( comp, i ) {
					if ( comp.applyEnter.type === "text" ) {
						unorderedTextIndexes.push( i );
						unorderedTexts.push( comp );
					}
				} );

				array.foreach( unorderedTexts.sort( function ( lhs, rhs ) {
					return lhs.zi - rhs.zi;
				} ), function ( comp, i ) {
					unorderedComponents[unorderedTextIndexes[i]] = comp;
				} );

				applySpeedA( unorderedComponents, speed[4], speed[5] );
			}

			// 处理多图
			array.foreach( enterComponentTable.mulitimage, function ( comp ) {
				last = multiImage.applyAnimation( comp, last );
			} );
		}
	}

	exports.analyzePage = analyzePage;
	exports.applySpeed = applySpeed;
	exports.applyAnimate = applyAnimate;
} );