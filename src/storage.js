/**
 * Created by 白 on 2015/7/17.
 * 存储
 */

library( function () {
	var object = imports( "object" ),
		items = JSON.parse( localStorage.getItem( "cookie" ) || "{}" );

	// 根据过期时间,清理cookie
	object.foreach( items, function ( key, value ) {
		if ( value.expires < new Date() ) {
			delete items[key];
		}
	} );

	// 保存cookie
	function save() {
		localStorage.setItem( "cookie", JSON.stringify( items ) );
	}

	save();

	module.exports = {
		getItem : function ( key ) {
			return items[key] ? items[key].value : null;
		},
		setItem : function ( key, value, timeToExpires ) {
			items[key] = {
				value : value,
				expires : ( new Date() ).getTime() + timeToExpires * 1000
			};
			save();
		}
	};
} );