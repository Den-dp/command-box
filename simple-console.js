/**
 * Created with IntelliJ IDEA.
 * User: Den_dp
 * Date: 20.09.12
 * Time: 16:10
 */

(function( scoupe ){

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

		input.addEventListener( 'input', function(){
			console.log( 'm-m-m-message' );
		});
		
	}

})( this );