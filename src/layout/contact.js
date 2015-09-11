/**
 * Created by 白 on 2014/10/17.
 * 联系我们板式
 */

plugin( function () {
	var array = imports( "array" ),
		Layout = imports( "../layout" ),
		Component = Layout.Component,
		layoutFormats = Layout.formats,
		Content = imports( "../content" ),
		p = imports( "../position" ),
		ui = imports( "../ui" ),
		env = imports( "../env" );

	layoutFormats.contact = {
		resource : {
			title : "contact/title",
			frame : "contact/frame"
		},
		create : function ( layout, ds, resource ) {
			var scale = layout.yScale / 1008 * 1136;

			// 底
			Component( Content.Cover( ds.image( 0 ), layout ), layout );

			// 遮罩
			Component( Content.Rect( layout.w, layout.h, "rgba(255,255,255,0.5)" ), layout );

			// 联系我们+线
			var title = Component( Content.Image( resource.title, scale ), layout );
			title.x = p.center( title, layout );
			title.y = 166 * scale / 2;

			// 制作item
			var frameImg = resource.frame,
				frameWidth = frameImg.halfWidth * scale << 0,
				frameHeight = frameImg.halfHeight * scale << 0,
				items = [];

			array.foreach( [
				{
					caption : "联系电话",
					click : function ( text ) {
						location.href = "tel:" + text;
					}
				},
				{
					caption : "联系邮箱",
					click : function ( text ) {
						location.href = "mailto:" + text;
					}
				},
				{
					caption : "官方网站",
					click : function ( text ) {
						env.jump( text );
					}
				},
				{
					caption : "微信号"
				},
				{
					caption : "微博",
					click : function ( text ) {
						env.jump( "http://weibo.com/n/" + text );
					}
				}
			], function ( info, i ) {
				var paddingX = 14 * scale,
					marginX = 8 * scale,
					text = ds.text( i ),
					fontRatio = Math.max( scale, 1 );

				if ( text.toString() === "" ) {
					return;
				}

				// 框
				var frame = Component( Content.Rect( frameWidth, frameHeight ), layout );
				frame.x = p.center( frame, layout );

				// 框背景
				Component( Content.Image( frameImg, scale ), frame );

				// caption
				var caption = Component( Content.Label( info.caption + "：", {
					fontSize : 14 * fontRatio << 0,
					color : "#FFFFFF"
				} ), frame );
				caption.x = paddingX;
				caption.y = p.middle( caption, frame, true );

				// 内容
				var content = Component( Content.BlockText( text, {
					lineHeight : 16 * fontRatio << 0,
					fontSize : 12 * fontRatio << 0,
					color : "#FFFFFF",
					margin : 0,
					width : frameWidth - 2 * paddingX - marginX - caption.w,
					breakWord : true
				} ), frame );
				content.x = p.rightTo( content, caption ) + marginX;
				content.y = p.middle( content, frame, true );

				// 点击
				ui.onTap( frame.element, function () {
					info.click && info.click( text.toString() );
				} );

				items.push( frame );
			} );

			// 摆放frame
			var startY = 143 * scale,
				totalHeight = 315 * scale,
				frameNumber = items.length,
				margin = ( totalHeight - frameHeight * frameNumber ) / ( frameNumber + 1 ) << 0;

			array.foreach( items, function ( frame, i ) {
				frame.y = startY + margin * ( i + 1 ) + frameHeight * i;
			} );
		}
	};
} );