/**
 * Created with IntelliJ IDEA.
 * User: Den_dp
 * Date: 20.09.12
 * Time: 16:10
 */

(function( scoupe ){

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
		var prevLength = 0;

		this.getWordBounds = function(){
			console.group('getWordBounds()');
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

			if( text[cursorPosition] === undefined ||
				( cursorPosition < input.value.length &&
					(prevLength > input.value.length && text[cursorPosition] === ' ' ) ) ) {

				if( cursorPosition - 1 >= 0 ) {
					cursorPosition--;
				} else {
					console.log( 'I see the first character in the string has no yet typed (or probably it was deleted)' );
				}
				// if str became longer
				// then we should catch the situation, when we insert spaces before word
				// or not?…
			} else if( cursorPosition < input.value.length && text[cursorPosition+1] !== undefined && prevLength < input.value.length && text[cursorPosition] === ' ' ) {
				cursorPosition++;
			} else {
				console.log( 'Default situation like typing characters' );
			}
			prevLength = input.value.length;

			// so, after preparations above we have 100% index of character under cursor
			// and now we have to try to detect left and right 'bounds' of this character
			// In best situation it would be the word otherwise it would be space character
			console.log( ">> %d %d '%s' '%s'", input.selectionStart, cursorPosition, text[input.selectionStart], text[cursorPosition] );

			begin = end = cursorPosition;
			for( var i = cursorPosition; i >= 0  && text[i] !== ' '; i-- ) {
				begin = i;
			}
			console.group('last symbol loop')
			for( var j = cursorPosition; j < text.length && text[j] !== ' '; j++ ) {
				end = j;
				console.log( 'end :"%s"',text[end] );
			}
			if( text.length > end ) {
				end++;
			}
			console.groupEnd();

			console.log( '%d %d : "%s"', begin, end, text.slice( begin, end ) );
			console.groupEnd();
			return {
				begin: begin,
				end: end
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
			console.log( "'%s'",res );
			return res;
		};

		this.setWordUnderCursor = function ( word ){
			var wordBounds = this.getWordBounds(),
				text = input.value,
				left = text.substr( 0, wordBounds.begin ),
				right = text.substr( wordBounds.end );
			text = left + word + right;
			input.value = text;
		}
	};

	/**
	 * Console constructor-function
	 *
	 * @param config is object with basic configs
	 * @param commands is array of commands (objects)
	 * @constructor
	 */
	scoupe.Console = function Console( config, commands ){
		var popupItemTemplate = config.popupItemTemplate || "{{name}} {{description}}",
			input = document.querySelector( config.inputSelector ),
			inputManager = new InputManager( input ),
			popup = document.querySelector( config.popupSelector ) ||
			(function(){
				var element = document.createElement( 'ul' ),
					// . or #
					selectorType = config.popupSelector.charAt(0),
					// part of string after . or #
					selector = config.popupSelector.substr(1);

				if( selectorType === '#' ) {
					element.id = selector;
				} else {
					element.className = selector;
				}
				element.style.display = 'none';
				return input.parentNode.insertBefore( element, input.nextSibling );
			})();

		function generateHtmlList( commands ){
			var htmlList = '';
			for ( var i in commands ) {
				htmlList += "<li class='choice' command='"+commands[i].name+"'>" + popupItemTemplate.replace( /{{(\w+)}}/gi, function(_, propertyName){
					return commands[i][propertyName];
				}) + "</li>";
			}
			return htmlList;
		}

		function repaintPopup( results ){
			if( !!results && results.length != 0 ){
				popup.style.display = 'block';
				popup.innerHTML = generateHtmlList( results );
			} else {
				popup.style.display = 'none';
			}
		}

		function fuzzySearchInCommands( query ){
			return grep( commands, function( _, obj ){
				if( obj.name.toLowerCase().indexOf( query.toLowerCase() ) != -1 ){
					return obj;
				} else {
					return null;
				}
			});
		}



		/**
		 * Fired when input in focus
		 * Draw popup, when input has some keywords
		 */
		input.addEventListener( 'focus', function(){
			var query = inputManager.getWordUnderCursor();
			if( query.length > 0 ) {
				repaintPopup( fuzzySearchInCommands( query ) );
			}
		});

		/**
		 * Fired when typing characters in input
		 * Redraws popup with fuzzy searhed list
		 */
		input.addEventListener( 'input', function(){
			repaintPopup( fuzzySearchInCommands( inputManager.getWordUnderCursor() ) );
		});

		/**
		 * Fired when input loses focus
		 * Redraws popup by empty list
		 */
		input.addEventListener( 'blur', function(){
			repaintPopup( );
		});

		/**
		 * Fired, when key pressed in input
		 * Used for UP and DOWN navigation and inserting selected
		 * command from navigation meny by pressing ENTER
		 */
		input.addEventListener( 'keydown', function ( key ){
			if( key.keyIdentifier === 'Up' || key.keyIdentifier === 'Down' || key.keyIdentifier === 'Enter' ){

				var items = popup.querySelectorAll('.choice' ),
					selectedItem = popup.querySelector('.choice.selected' );

				if( !!items && items.length > 0 ) {

					if( !!selectedItem ) {
						if( key.keyIdentifier === 'Up' ) {
							selectedItem.classList.remove( 'selected' );
							if( !!selectedItem.previousSibling ){
								selectedItem = selectedItem.previousSibling;}

						} else if( key.keyIdentifier === 'Down' ) {
							selectedItem.classList.remove( 'selected' );
							if( !!selectedItem.nextSibling )
								selectedItem = selectedItem.nextSibling;
						}
						selectedItem.classList.add( 'selected' );
					} else {
						selectedItem = items[0];
						selectedItem.classList.add( 'selected' );

					}
					if( key.keyIdentifier === 'Enter' ) {
						inputManager.setWordUnderCursor( selectedItem.getAttribute('command') );
					}
				}
			}
		});

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
					commands.splice(i,1);
					return;
				}
			}
		}
	}

})( this );