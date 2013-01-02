/**
 * Created with IntelliJ IDEA.
 * User: Den_dp
 * Date: 20.09.12
 * Time: 16:10
 */

(function( scoupe ){
	var DEBUG = false;

	/**
	 * Finds the elements of an array which satisfy a filter function.
	 * The original array is not affected
	 *
	 * @param objArray
	 * @param filter (elementOfArray,indexInArray) is a function that provides criteries for
	 *        grepping passed objects
	 * @return {Array}
	 */
	function grep( objArray, filter ){
		var greppedItems = [];
		for ( var i in objArray ) {
			var temp = filter( i, objArray[i] );
			if( !!temp ){
				greppedItems.push( temp );
			}
		}
		return greppedItems;
	}

	/**
	 * Input manager constructor function
	 * Provides some abstraction level and helps to perform extended actions with input element
	 * e.g. get word under cursor and etc.
	 *
	 * @param input
	 * @constructor
	 */
	var InputManager = function( input ){
		var prevLength = 0,
			cachedBegin = 0,
			cachedEnd = 0;

		this.getWordBounds = function(){
			DEBUG && console.group('getWordBounds()');
			var cursorPosition = input.selectionStart,
				text = input.value,
				begin = 0,
				end = 0;

			// There are some problems to detect the symbol under cursor if we pressed BACKSPACE or DELETE:
			// undefined value or not actual cursor position
			// To handle BACKSPACE pressing we should expect next situations:
			// - symbol under cursorPosition is undefined
			// - symbol under cursorPosition is character, but length of all string is increased
			// and then we should try to get previous symbol
			// but catch the situation if str length is smaller and no prev symbol available

			// true if we
			// * delete last character of the end of the input value
			// or
			// * delete character in the middle of the input value
			if( text[cursorPosition] === undefined ||
				( cursorPosition < input.value.length &&
					(prevLength > input.value.length && text[cursorPosition] === ' ' ) ) ) {

				if( cursorPosition - 1 >= 0 ) {
					cursorPosition--;
				} else {
					DEBUG && console.log( 'I see the first character in the string has no yet typed (or probably it was deleted)' );
				}
				// if str became longer
				// then we should catch the situation, when we insert spaces before word
				// or not?…
			} else if( cursorPosition < input.value.length && text[cursorPosition+1] !== undefined && prevLength < input.value.length && text[cursorPosition] === ' ' ) {
				cursorPosition++;
			} else {
				DEBUG && console.log( 'Default situation like typing characters' );
			}
			prevLength = input.value.length;

			// so, after preparations above we have 100% index of character under cursor
			// and now we have to try to detect left and right 'bounds' of this character
			// In best situation it would be the word otherwise it would be space character
			DEBUG && console.log( ">> %d %d '%s' '%s'", input.selectionStart, cursorPosition, text[input.selectionStart], text[cursorPosition] );

			begin = end = cursorPosition;
			for( var i = cursorPosition; i >= 0  && text[i] !== ' '; i-- ) {
				begin = i;
			}
			DEBUG && console.group('last symbol loop');
			for( var j = cursorPosition; j < text.length && text[j] !== ' '; j++ ) {
				end = j;
				DEBUG && console.log( 'end :"%s"',text[end] );
			}
			if( text.length > end ) {
				end++;
			}
			DEBUG && console.groupEnd();

			DEBUG && console.log( '%d %d : "%s"', begin, end, text.slice( begin, end ) );
			DEBUG && console.groupEnd();
			return {
				begin: cachedBegin = begin,
				end: cachedEnd = end
			};
		};

		/**
		 * Returns typed word
		 * @return {String}
		 */
		this.getWordUnderCursor = function (){
			var wordBounds = this.getWordBounds(),
				text = input.value,
				res = '';
			if( text.length > 0 ) {
				res = text.slice( wordBounds.begin, wordBounds.end );
			} else {
				res = '';
			}
			DEBUG && console.log( "'%s'",res );
			return res;
		};

		this.getChachedWordBounds = function(){
			DEBUG && console.log( 'from caaacchhheee:%d %d',cachedBegin, cachedEnd );
			return {
				begin: cachedBegin,
				end: cachedEnd
			};
		};

		this.setWordUnderCursor = function ( word ){
			var wordBounds = this.getChachedWordBounds(),
				text = input.value,
				left = text.substr( 0, wordBounds.begin ),
				right = text.substr( wordBounds.end );
			text = left + word + right;
			input.value = text;
		};
	};

	/**
	 * DropDownMenu function-constructor
	 *
	 * @param config
	 * @constructor
	 */
	var DropDownMenu = function( config ){
		var dropDownMenuItemTemplate = config.dropDownMenuItemTemplate || "{{name}} {{description}}",
			dropDownMenu = config.dropDownMenuSelector;

		function generateHtmlList( commands ){
			var htmlList = '';
			for ( var i in commands ) {
				htmlList += "<li class='choice' command='"+commands[i].name+"'>" + dropDownMenuItemTemplate.replace( /\{\{(\w+)\}\}/gi, function(_, propertyName){
					return commands[i][propertyName];
				}) + "</li>";
			}
			return htmlList;
		}

		this.show = function(){
			dropDownMenu.style.display = 'block';
		};

		this.hide = function(){
			dropDownMenu.style.display = 'none';
		};

		this.isVisible = function() {
			return dropDownMenu.style.display === 'block';
		};

		this.update = function( results ){
			if( !!results && results.length !== 0 ){
				this.show();
				dropDownMenu.innerHTML = generateHtmlList( results );
			} else {
				this.hide();
			}
		};

		this.selectPrevItem = function() {
			var items = dropDownMenu.querySelectorAll( '.choice' ),
				selectedItem = dropDownMenu.querySelector( '.choice.selected' );

			if( !!items && items.length > 0 ) {
				if( !!selectedItem ) {
					selectedItem.classList.remove( 'selected' );
					if( !!selectedItem.previousSibling ){
						selectedItem = selectedItem.previousSibling;
						selectedItem.scrollIntoView(false);
					}
					selectedItem.classList.add( 'selected' );
				} else {
					selectedItem = items[0];
					selectedItem.classList.add( 'selected' );
				}
			}
		};

		this.selectNextItem = function() {
			var items = dropDownMenu.querySelectorAll( '.choice' ),
				selectedItem = dropDownMenu.querySelector( '.choice.selected' );

			if( !!items && items.length > 0 ) {
				if( !!selectedItem ) {
					selectedItem.classList.remove( 'selected' );
					if( !!selectedItem.nextSibling ) {
						selectedItem = selectedItem.nextSibling;
						selectedItem.scrollIntoView(false);
					}
					selectedItem.classList.add( 'selected' );
				} else {
					selectedItem = items[0];
					selectedItem.classList.add( 'selected' );
				}
			}
		};

		this.getSelectedItem = function() {
			var items = dropDownMenu.querySelectorAll( '.choice' ),
				selectedItem = dropDownMenu.querySelector( '.choice.selected' );

			if( !!items && items.length > 0 ) {
				return selectedItem.getAttribute( 'command' );
			}
		};

	};

	var CommandManager = function( commands ){
		var cachedStack = null;

		function parseStatement( str ){
			var stack = [];
			cachedStack = [];
			str.split( /\s+/ ).forEach(function( command ){
				stack.push( command );
				cachedStack.push( command );
			});
			return stack;
		}

		this.isValidStatement = function( statemet ){
			// trim left and right
			statemet = statemet.replace(/^\s*/,'').replace(/\s*$/,'');

			var stack = parseStatement( statemet );
			DEBUG && console.log( stack );
			if( !isExists( stack[0] ) ){
				return false;
			}
			return true;
		};

		this.fuzzySearch = function( query ){
			return grep( commands, function( _, obj ){
				if( obj.name.toLowerCase().indexOf( query.toLowerCase() ) != -1 ){
					return obj;
				} else {
					return null;
				}
			});
		};

		function isExists( commandName ){
			for( var i in commands ) {
				if( commands[i].name === commandName ) {
					return true;
				}
			}
			return false;
		}

		this.executeStatement = function() {
			if( !!cachedStack ){
				DEBUG && console.log( commands, cachedStack );
				// TODO: in that place I realized, that the best way to ommit a lote of code is in using hash instead of array.
				// But mb there is a problem in deleting fields in hashes.
				for( var i in commands ){
					if( commands[i].name === cachedStack[0] ){
						DEBUG && console.log( commands[i].listener, 'called with', cachedStack[1], cachedStack[2] );
						return commands[i].listener( cachedStack[1], cachedStack[2] );
					}
				}
			}
		};

		this.addCommand = function( command ){
			if( command instanceof Array ){
				for( var i in command ){
					commands.push( command[i] );
				}
			} else {
				commands.push( command );
			}
		};

		this.removeCommand = function( command ){
			var commandName = command instanceof Object? command.name : command;
			for( var i in commands ) {
				if( commands[i].name === commandName ) {
					commands.splice( i, 1 );
					return;
				}
			}
		};

	};

	/**
	 * Console constructor-function
	 *
	 * @param config is object with basic configs
	 * @param commands is array of commands (objects)
	 * @constructor
	 */
	scoupe.CommandBox = function( config, commands ){
		var input = document.querySelector( config.inputSelector ),
			inputManager = new InputManager( input ),
			commandManager = new CommandManager( commands ),
		// _ is the way to extend config in the same place
			_ = config.dropDownMenuSelector = document.querySelector( config.dropDownMenuSelector ) ||
				(function(){
					var element = document.createElement( 'ul' ),
					// . or #
						selectorType = config.dropDownMenuSelector.charAt(0),
					// part of string after . or #
						selector = config.dropDownMenuSelector.substr(1);

					if( selectorType === '#' ) {
						element.id = selector;
					} else {
						element.className = selector;
					}
					element.style.display = 'none';
					return input.parentNode.insertBefore( element, input.nextSibling );
				})(),
			dropDownMenu = new DropDownMenu( config );

		/**
		 * Fired when input in focus
		 * Draw dropDownMenu, when input has some keywords
		 */
		input.addEventListener( 'focus', function(){
			var query = inputManager.getWordUnderCursor();
			if( query.length > 0 ) {
				dropDownMenu.update( commandManager.fuzzySearch( query ) );
			}
		});

		/**
		 * Fired when typing characters in input
		 * Redraws dropDownMenu with fuzzy searhed list
		 */
		input.addEventListener( 'input', function(){
			dropDownMenu.update( commandManager.fuzzySearch( inputManager.getWordUnderCursor() ) );
		});

		/**
		 * Fired when input loses focus
		 * Redraws dropDownMenu by empty list
		 */
		input.addEventListener( 'blur', function(){
			dropDownMenu.update( );
		});

		/**
		 * Fired, when key pressed in input
		 * Used for UP and DOWN navigation and inserting selected
		 * command from navigation meny by pressing ENTER
		 */
		input.addEventListener( 'keydown', function ( e ){
			if( e.keyIdentifier === 'Up' ) {
				e.preventDefault();
				dropDownMenu.selectPrevItem();
			} else if( e.keyIdentifier === 'Down' ) {
				e.preventDefault();
				dropDownMenu.selectNextItem();
			} else if( e.keyIdentifier === 'Enter' ) {
				if( !dropDownMenu.isVisible() && commandManager.isValidStatement( input.value ) ){
					var executeStatement = commandManager.executeStatement();
					DEBUG && console.log( 'executeStatement',executeStatement );
					if( executeStatement ){
						input.value = '';
					}
				} else {
					inputManager.setWordUnderCursor( dropDownMenu.getSelectedItem() );
					dropDownMenu.hide();
				}
			}
		});

		this.addCommand = function( command ){
			commandManager.addCommand( command );
		};

		this.removeCommand = function( command ){
			commandManager.removeCommand( command );
		};
	};

})( this );