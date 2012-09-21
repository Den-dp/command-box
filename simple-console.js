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
		var input = document.querySelector( config.inputSelector ),
			popup = document.querySelector( config.popupSelector ) ||
			(function(){
				var element = document.createElement( 'div' ),
					// . or #
					selectorType = config.popupSelector[0],
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
				htmlList += "<div class='choice'>"+commands[i].name+"</div>";
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

		input.addEventListener( 'focus', function(){
			var query = input.value;
			if( query.length > 0 ) {
				repaintPopup( fuzzySearchInCommands( query ) );
			}
		});

		input.addEventListener( 'input', function(){
			repaintPopup( fuzzySearchInCommands( input.value ) );
		});

		/**
		 * Fired when input loses focus
		 * Redraws popup by empty list
		 */
		input.addEventListener( 'blur', function(){
			repaintPopup( );
		});
		
	}

})( this );