import { log, info, warn, error, debug } from 'console';

type Command = (...args: string[]) => Promise<void> | void;
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
		return Bun.spawnSync(
			[cmd, ...args]
		)
		.stdout
		.toString()
	}

	static async spawn(cmd: string, ...args: string[]) {
		const process = Bun.spawn({
			cmd: [cmd, ...args]
		});
		const printer = new Print;
		printer.header(`SHELL :: ${ [cmd, ...args].join(" ") }`);
		/** @ts-expect-error */
		for await (const chunk of process.stdout)
			Bun.write(Bun.stdout, new TextDecoder().decode(chunk).trim());
		printer.ln("");
		printer.done(`EXITING SUBSHELL...`);
		printer.hr();

		return process;
	}
}

export class Print extends Terminal {
	constructor() {
		super();
	}

	write(msg = ""): Print {
		Bun.write(Bun.stdout, msg);
		return this;
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

	hr(size = this.width): Print {
		return this.ln("╌".repeat(size));
	}

	header(title: string, size = this.width): Print {
		this.ln("╔" + "═".repeat(size - 2) + "╗");
		this.ln(`║ ${
			title.length > size ?
				title.slice(0, size - 7 - title.length) + '...' :
				title + " ".repeat(size - 4 - title.length)
		} ║`);
		this.ln("╚" + "═".repeat(size - 2) + "╝");
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

	async main(cmd: string, ...args: string[]) {
		if (this.#commands[App.COMMAND])
			return await this.pass(App.COMMAND, cmd, ...args);

		if (!cmd)
			return await this.pass(App.DEFAULT);
	
		if (this.#commands[cmd]) {
			await this.pass(App.START, cmd, ...args);
			await this.pass(cmd, ...args);
			await this.pass(App.END, cmd, ...args);

			return;
		}

		this.print.error(`Command "${ cmd }" not found.`);
		this.exit(1);
	}

	async pass(cmd: string, ...args: string[]) {
		await this.#commands[cmd]?.call(this, ...args);
	}

	exit(code = 0) {
		this.print.info(`Exiting with code ${ code }.`)
		process.exit(code);
	}

	async run() {
		const [cmd, ...args] = process.argv.slice(2);
		await this.main(cmd, ...args);
	}
}
