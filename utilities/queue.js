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

	get length() {
		return this.tail - this.head;
	}

	get isEmpty() {
		return this.length === 0;
	}
}

module.exports = Queue;
