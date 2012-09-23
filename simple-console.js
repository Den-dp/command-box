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
			i = 0,
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
				htmlList += "<li class='choice'>" + popupItemTemplate.replace( /{{(\w+)}}/gi, function(_, propertyName){
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
		 * Returns typed word
		 * @return {String}
		 */
		function getWordUnderCursor(){
			var cursorPosition = input.selectionStart,
				text = input.value,
				start = 0,
				stop = 0,
				res = '';
			if( text.length > 0 ) {
				for( var i = cursorPosition; i <= text.length && text[i] !== ' '; i++ ) {
					stop = i;
				}
				for( var j = cursorPosition; j >= 0  && text[j] !== ' '; j-- ) {
					start = j;
				}
				res = text.slice( start, stop );
			} else {
				res = '';
			}
			console.log( start,stop,res );
			return res;
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

				if ( !!selectedItem ){
					selectedItem.classList.remove( 'selected' );
				}

				if( !!items && items.length > 0 ) {
					switch ( key.keyIdentifier ) {
						case 'Up':
							i--;
							if( i < 0 ) i = items.length-1;
							break;
						case 'Down':
							i++;
							if( i >= items.length ) i = 0;
							break;
						case 'Enter':
							input.value = commands[i].name;
							break;
					}
					items[i].classList.add( 'selected' );
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