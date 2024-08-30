import App from "..";

const example = new App({
	[App.DEFAULT]: () => example.print.info(`Hello, World.`),
	bye() {
		this.print.error('GOOD BYE.');
		this.exit();
	}
});

example.run();
