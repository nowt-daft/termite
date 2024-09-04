import App, { Terminal } from "..";

const example: App = new App({
	[App.DEFAULT]: async () => {
		example.print.header("THIS IS AN EXAMPLE FILE. BUT, HERE, IN THIS OUTPUT, WE ARE GOING TO WRITE A HEADER THAT IS TOO LONG.");
		await Terminal.spawn("yes", "yes");
	},
	bye: () => {
		example.print.error('GOOD BYE.');
	}
});

example.run();
