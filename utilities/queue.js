class Queue {
	constructor() {
		this.elements = {};
		this.head = 0;
		this.tail = 0;
	}

	enqueue(element) {
		this.elements[this.tail] = element;
		this.tail++;
	}

	dequeue() {
		const item = this.elements[this.head];
		delete this.elements[this.head];
		this.head++;
		return item;
	}

	peek() {
		return this.elements[this.head];
	}

	get(index) {
		if (index < 0 || index >= this.length) {
			return undefined;
		}
		return this.elements[this.head + index];
	}

	indexOfFirst(element) {
		for (let i = 0; i < this.length; i++) {
			if (this.elements[this.head + i] === element) {
				return i;
			}
		}
		return -1;
	}

	clear() {
		this.elements = {};
		this.head = 0;
		this.tail = 0;
	}

	shuffle() {
		const length = this.length;
		for (let i = length - 1; i > 0; i--) {
			const randomIndex = Math.floor(Math.random() * (i + 1));
			const currentIndex = this.head + i;
			const randomIndexWithOffset = this.head + randomIndex;
			const temp = this.elements[currentIndex];
			this.elements[currentIndex] = this.elements[randomIndexWithOffset];
			this.elements[randomIndexWithOffset] = temp;
		}
	}

	remove(index) {
		if (index < 0 || index >= this.length) {
			return null;
		}
		const removedElement = this.elements[this.head + index];
		for (let i = index; i < this.length - 1; i++) {
			this.elements[this.head + i] = this.elements[this.head + i + 1];
		}
		delete this.elements[this.tail - 1];
		this.tail--;
		return removedElement;
	}

	removeByQuery(title, exact = false, all = false) {
		const removed = [];
		for (let i = this.length - 1; i >= 0; i--) {
			const element = this.elements[this.head + i];
			const isMatch = exact
				? element.title === title
				: element.title.toLowerCase().includes(title.toLowerCase());
			if (isMatch) {
				removed.push(element);
				this.remove(i);
				if (!all) {
					break;
				}
			}
		}
		return removed;
	}

	search(title, exact = true, all = true) {
		const matches = [];
		for (let i = 0; i < this.length; i++) {
			const element = this.elements[this.head + i];
			const isMatch = exact
				? element.title === title
				: element.title.toLowerCase().includes(title.toLowerCase());
			if (isMatch) {
				matches.push(element);
				if (!all) {
					break;
				}
			}
		}
		return matches;
	}

	get length() {
		return this.tail - this.head;
	}

	get isEmpty() {
		return this.length === 0;
	}
}

module.exports = Queue;
