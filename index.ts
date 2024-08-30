import { log, info, warn, error, debug } from 'console';

type Command = (...args: string[]) => void;
type Commands = Record<string,Command>;

export class Terminal {
	get width(): number {
		return Number(
			Terminal.run("tput", "cols")
		);
	}

	get height(): number {
		return Number(
			Terminal.run("tput", "lines")
		);
	}

	clear(): Terminal {
		Terminal.run("clear");
		return this;
	}

	static run(cmd: string, ...args: string[]): string {
		return Bun.spawnSync({
			cmd: [cmd, ...args]
		})
		.stdout
		.toString()
	}
}

export class Print extends Terminal {
	constructor() {
		super();
	}

	ln(...msgs: string[]): Print {
		for (const msg of msgs)
			log(msg);
		return this;
	}

	log(msg = 'log'): Print {
		log(` - ${msg}`);
		return this;
	}

	info(msg = 'info'): Print {
		info(`🛈 ${msg}`);
		return this;
	}

	warn(msg = ':S'): Print {
		warn(`⚡ ${msg}`);
		return this;
	}

	error(msg = ':('): Print {
		error(`💔 ERROR: ${msg}`);
		return this;
	}

	debug(msg = 'here!'): Print {
		debug(`🐛 ${msg}`);
		return this;
	}

	done(msg = ''): Print {
		return this.ln(`✔ DONE ${msg}`);
	}

	hr(char = '•', size = this.width): Print {
		return this.ln(char.repeat(size));
	}

	header(title: string, char = '•', size = this.width): Print {
		this.hr(char, size);
		this.ln(`${ char } ${ title }`);
		this.hr(char, size);
		return this;
	}

	list(items: string[]): Print {
		return this.ln(
			...items.map(item => ` • ${item}`)
		);
	}
}

export default class App {
	/** We use this if our app only has ONE command */
	static COMMAND = '@command';
	static DEFAULT = '@default';
	static START = '@start';
	static END = '@end';

	#commands: Commands;

	get menu() {
		const exclude = [App.COMMAND, App.DEFAULT, App.START, App.END];
		return Object
			.keys(this.#commands)
			.filter(
				cmd => !exclude.includes(cmd)
			);
	}

	print = new Print;

	constructor(commands: Command | Commands) {
		this.#commands =
			typeof commands === "function" ?
				{ [App.COMMAND]: commands } :
				commands;
	}

	main(cmd: string, ...args: string[]) {
		if (this.#commands[App.COMMAND])
			return this.pass(App.COMMAND, cmd, ...args);

		if (!cmd)
			return this.pass(App.DEFAULT);
	
		if (this.#commands[cmd]) {
			this.pass(App.START, cmd, ...args);
			this.pass(cmd, ...args);
			this.pass(App.END, cmd, ...args);

			return;
		}

		this.print.error(`Command "${ cmd }" not found.`);
		this.exit(1);
	}

	pass(cmd: string, ...args: string[]) {
		this.#commands[cmd]?.call(this, ...args);
	}

	exit(code = 0) {
		this.print.info(`Exiting with code ${ code }.`)
		process.exit(code);
	}

	run() {
		const [cmd, ...args] = process.argv.slice(2);
		this.main(cmd, ...args);
	}
}
