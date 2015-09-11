/**
 * Created by 白 on 2015/9/1.
 */

library( function () {
	var URL = imports( "url" ),
		ua = imports( "./ua" ),
		$ = imports( "element" ),
		animation = imports( "animation" );

	module.exports = function ( workBody, musicIcon ) {
		var workData = workBody.workData,
			src = workData.music, // 音乐src
			audio = $( "<audio loop></audio>", workBody ); // audio标签

		musicIcon = musicIcon || {};
		workBody.audioPlayIntention = true; // 音乐播放意图

		audio.onerror = function () {
			audio.onerror = null;
			audio.src = URL.concatArg( src, {
				t : new Date().getTime()
			} );
			musicIcon.play && audio.play();
		};

		if ( !ua.ios ) {
			$.bind( audio, "loadeddata", function () {
				animation.requestFrames( {
					duration : 3,
					onAnimate : function ( ratio ) {
						audio.volume = ratio;
					}
				} );
			} );
		}

		// 停止播放音乐
		workBody.stopAudio = function () {
			if ( musicIcon.play === true ) {
				workBody.audioPlayIntention = false;
				musicIcon.play = false;
				audio.pause();
			}
		};

		// 播放音乐
		workBody.playAudio = function () {
			if ( !audio.src ) {
				audio.src = src;
			}

			if ( musicIcon.play !== true ) {
				workBody.audioPlayIntention = true;
				musicIcon.play = true;
				audio.play();
			}
		};

		// 是否播放
		workBody.isAudioPlaying = function () {
			return !audio.paused;
		};

		return audio;
	};
} );