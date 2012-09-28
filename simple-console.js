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
	 * Console constructor-function
	 *
	 * @param config is object with basic configs
	 * @param commands is array of commands (objects)
	 * @constructor
	 */
	scoupe.Console = function Console( config, commands ){
		var popupItemTemplate = config.popupItemTemplate || "{{name}} {{description}}",
			input = document.querySelector( config.inputSelector ),
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

		var prevLength = 0,
			prevPosition = 0;
		function getWordBounds(){
			console.group('getWordBounds()');
			var cursorPosition = input.selectionStart,
				prevPosition = cursorPosition,
				text = input.value,
				start = 0,
				stop = 0,
				res = '';

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

			start = stop = cursorPosition;
			for( var i = cursorPosition; i >= 0  && text[i] !== ' '; i-- ) {
				start = i;
			}
			console.group('last symbol loop')
			for( var j = cursorPosition; j < text.length && text[j] !== ' '; j++ ) {
				stop = j;
				console.log( 'stop :"%s"',text[stop] );
			}
			if( text.length > stop ) {
				stop++;
			}
			console.groupEnd();

			console.log( '%d %d : "%s"', start, stop, text.slice( start, stop ) );
			console.groupEnd();
			return {
				start: start,
				stop: stop
			};
		}

		/**
		 * Returns typed word
		 * @return {String}
		 */
		function getWordUnderCursor(){
			var wordBounds = getWordBounds();
			var text = input.value,
				res = '';
			if( text.length > 0 ) {
				res = text.slice( wordBounds.start, wordBounds.stop );
			} else {
				res = '';
			}
			console.log( "'%s'",res );
			return res;
		}

		function setWordUnderCursor( word ){
			var wordBounds = getWordBounds(),
				text = input.value,
				left = text.substr(0,wordBounds.start ),
				right = text.substr(wordBounds.stop);
			text = left + word + right;
			input.value = text;
		}

		/**
		 * Fired when input in focus
		 * Draw popup, when input has some keywords
		 */
		input.addEventListener( 'focus', function(){
			var query = getWordUnderCursor();
			if( query.length > 0 ) {
				repaintPopup( fuzzySearchInCommands( query ) );
			}
		});

		/**
		 * Fired when typing characters in input
		 * Redraws popup with fuzzy searhed list
		 */
		input.addEventListener( 'input', function(){
			repaintPopup( fuzzySearchInCommands( getWordUnderCursor() ) );
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
						setWordUnderCursor( selectedItem.getAttribute('command') );
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