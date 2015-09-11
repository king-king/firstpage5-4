/**
 * Created by 白 on 2015/8/25.
 */

library( function () {
	var Stream = imports( "stream" ),
		StringStream = Stream.StringStream,
		array = imports( "array" );

	module.exports = function ( text ) {
		var timeLine = [];

		// 解析歌词文件
		array.foreach( text.split( "\n" ), function ( line ) {
			if ( line !== "" ) {
				line = line.replace( "\r", "" );
				var stream = StringStream( line );
				var times = [], minutes, seconds;

				// 读到某字符为止
				function readUntil( ch ) {
					var word = "", cur;
					while ( ( cur = stream.cur() ) !== ch ) {
						word += cur;
						stream.eat();
					}
					return word;
				}

				while ( stream.cur() === "[" ) {
					stream.eat();
					if ( !isNaN( parseInt( stream.cur(), 10 ) ) ) {
						minutes = parseInt( readUntil( ":" ), 10 );
						stream.eat(); // 吃掉冒号
						seconds = parseFloat( readUntil( "]" ) );
						stream.eat(); // 吃掉右方括号
						times.push( minutes * 6000 + seconds * 100 );
					}
					else {
						stream.unEat();
						break;
					}
				}

				// 当有时刻时,继续解析该行,否则放弃该行
				if ( times.length !== 0 ) {
					var lyric = readUntil( "" ); // 读歌词

					// 添加到时间轴
					array.foreach( times, function ( time ) {
						timeLine.push( {
							start : time,
							lyric : lyric,
							pos : timeLine.length
						} );
					} );
				}
			}
		} );

		timeLine.sort( function ( a, b ) {
			return a.start < b.start ? -1 : a.start > b.start ? 1 :
				a.pos < b.pos ? -1 : 1;
		} );

		if ( timeLine[0].start !== 0 ) {
			timeLine.unshift( {
				start : 0,
				lyric : " "
			} );
		}

		return timeLine;
	};
} );