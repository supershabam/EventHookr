/****************************************************
 * EventHookr
 * Copyright(c) 2011 Ian Hansen <ian@supershabam.com>
 * MIT Licensed
 ****************************************************/
 
/**
 * PrefixTrie
 * 
 * This class is a data structure to allow for fast partial event matching
 */
function PrefixTrie() {
	this._index = {};
	this._root = new PrefixTrieNode();
}

/**
 * add : (string) prefix, (string) matchId -> boolean
 * 
 * adds the specified prefix to the trie and associates
 * the provided matchId with the prefix. If the matchId
 * is currently in use, this function will return false and
 * the prefix will not be added to the trie.
 */
PrefixTrie.prototype.add = function(prefix, matchId) {
	if (this._index[matchId]) return false;
	
	var insertionPoint = this._root;
	var next = insertionPoint.nearestChild(prefix);
	while(next) {
		insertionPoint = next;
		
		var commonPrefix = commonPrefixOf(prefix, insertionPoint.prefix);
		
		// added prefix causes existing node to be split
		if (commonPrefix.length < insertionPoint.prefix.length) {
			insertionPoint = new PrefixTrieNode();
			insertionPoint.prefix = commonPrefix;
			insertionPoint.parent = next.parent;
			insertionPoint.children = [next];
			
			insertionPoint.parent.removeChild(next);
			insertionPoint.parent.addChild(insertionPoint);
			
			next.parent = insertionPoint;
			next.prefix = next.prefix.substr(commonPrefix.length);
			prefix = prefix.substr(commonPrefix.length);
			break;
		}
		
		prefix = prefix.substr(insertionPoint.prefix.length); // crop the matched prefix
		var next = insertionPoint.nearestChild(prefix);
	}
	
	// create new node
	if (prefix.length > 0) {
		var node = new PrefixTrieNode();
		node.prefix = prefix;
		node.parent = insertionPoint;
		insertionPoint.addChild(node);
		
		insertionPoint = node;
	}
	
	insertionPoint.matches[matchId] = true;
	this._index[matchId] = insertionPoint;
	
	return true;
};

/**
 * match : (string) prefix -> (array of int) matches
 *
 * match the provided prefix against the prefixes stored in the trie. Any
 * matched prefix is added to the result array returned by this function.
 * It is the users' responsibility to determine what to do when a certain match
 * id is returned by this function.
 */
PrefixTrie.prototype.match = function(prefix) {
	var result = [];
	
	var matchingNode = this._root;
	while(matchingNode) {
		if (matchingNode.prefix.length > prefix.length) break;
		
		for (var matchId in matchingNode.matches) 
			result.push(matchId);
		prefix = prefix.substr(matchingNode.prefix.length);
		matchingNode = matchingNode.nearestChild(prefix);
	}
		
	return result;
};

/**
 * remove : (int) match id -> (boolean) success?
 *
 * if the match id specified exists in the trie and is successfully removed, return true
 * otherwise return false
 */
PrefixTrie.prototype.remove = function(matchId) {
	var node = this._index[matchId];
	if (node && node.matches[matchId]) {
		delete node.matches[matchId];
		delete this._index[matchId];
		return true;
	}
	return false;
};

/**
 * PrefixTrieNode
 */
function PrefixTrieNode() {
    this.prefix = "";
    this.children = [];
	this.parent = null;
	this.matches = {};
}

/**
 * nearestChild : (string) prefix -> (PrefixTrieNode || null)
 * @param prefix
 * @returns
 */
PrefixTrieNode.prototype.nearestChild = function(prefix) {
	if (prefix.length == 0) return null;
	for (var i = 0; i < this.children.length; i++) {
		if (commonPrefixOf(prefix, this.children[i].prefix).length > 0) {
			return this.children[i];
		}
	}
	return null;
};

PrefixTrieNode.prototype.removeChild = function(node) {
	for(var i = 0; i < this.children.length; i++) {
		if (this.children[i] == node) {
			this.children.splice(i, 1);
		}
	}
};

PrefixTrieNode.prototype.addChild = function(node) {
	this.children.push(node);
};


function commonPrefixOf(a, b) {
    var i;
	for (i = 0; i < a.length && i < b.length; i++) {
		if (a.charCodeAt(i) != b.charCodeAt(i)) break;
	}
	return a.substring(0, i);
}



module.exports = PrefixTrie;