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
	 * @param commandsArray is array of commands (objects)
	 * @constructor
	 */
	scoupe.Console = function Console( config, commandsArray ){
		var input = document.querySelector( config.selector );
		this.commands = commandsArray;
		var self = this;

		input.addEventListener( 'input', function(){
			var results = grep( self.commands, function( _, obj ){
				if( obj.name.toLowerCase().indexOf( input.value.toLowerCase() ) != -1 ){
					return obj;
				}
			});
			console.log( results );
		});
		
	}

})( this );