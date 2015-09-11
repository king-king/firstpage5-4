/**
 * Created by Zuobai on 2014/11/22.
 */

library( function () {
	var object = imports( "object" ),
		is = object.is;

	// 链表
	function LinkedList() {
		var head = null, tail = null;

		function remove( node ) {
			if ( node.inserted === true ) {
				node.previous ? node.previous.next = node.next : head = node.next;
				node.next ? node.next.previous = node.previous : tail = node.previous;
				node.inserted = false;
			}
		}

		return {
			head : function () {
				return head;
			},
			tail : function () {
				return tail;
			},
			insert : function ( tarNode, refNode ) {
				if ( tarNode === refNode ) {
					return;
				}
				remove( tarNode );
				var previous = refNode ? refNode.previous : tail;
				tarNode.next = refNode;
				tarNode.previous = previous;
				previous ? previous.next = tarNode : head = tarNode;
				refNode ? refNode.previous = tarNode : tail = tarNode;
				tarNode.inserted = true;
				return tarNode;
			},
			remove : remove
		};
	}

	// 遍历
	function foreach( list, func ) {
		var retVal;
		for ( var cur = list.head(); cur !== null; cur = cur.next ) {
			if ( ( retVal = func( cur ) ) !== undefined ) {
				return retVal;
			}
		}
	}

	// 迭代,从begin到end,默认end是null,可指定迭代方向
	function iterate( begin, arg2, arg3, arg4 ) {
		var end, block, reverse, cur, retVal;
		if ( is.Function( arg2 ) ) {
			end = null;
			block = arg2;
			reverse = arg3;
		}
		else {
			end = arg2;
			block = arg3;
			reverse = arg4;
		}

		for ( cur = begin; cur !== end; cur = reverse ? cur.previous : cur.next ) {
			if ( ( retVal = block( cur ) ) !== undefined ) {
				return retVal;
			}
		}
	}

	function isBefore( node1, node2 ) {
		for ( ; node2 && node2 !== node1; node2 = node2.next ) {
		}
		return node2 === null;
	}

	module.exports = LinkedList;
	LinkedList.foreach = foreach;
	LinkedList.iterate = iterate;
	LinkedList.isBefore = isBefore;
} );