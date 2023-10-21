import fetchJson from './utils/fetch-json.js';
 
class SortableTableV1 {
  constructor(headerConfig = [], data = []) {
 
    this.headerConfig = headerConfig;
    this.data = data;
    this.element = this.createElement();
 
    this.subElements = { body: this.element.querySelector('[data-element="body"]'), };
  }
 
  render(container = document.body) {
    container.appendChild(this.element);
  }
 
  createElement() {
    const element = document.createElement('div');
    element.innerHTML = this.createTemplate();
    return element.firstElementChild;
  }
 
  createTemplate() {
    return this.createTableTemplate();
  }
 
  createTableTemplate() {
    return (
 
      `
    <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
            <div data-element="header" class="sortable-table__header sortable-table__row">
 
                ${ this.createTableHeaderTemplate() }
 
            </div>
            <div data-element="body" class="sortable-table__body">
 
                ${ this.createTableRowsTemplate() }
 
            </div>
            <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
            <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
                <div>
                    <p>No products satisfies your filter criteria</p>
                    <button type="button" class="button-primary-outline">Reset all filters</button>
                </div>
            </div>
        </div>
    </div>
    
    `);
  }
 
  createTableHeaderTemplate = () => this.headerConfig.map(header =>
    `
            <div class="sortable-table__cell" data-id="${ header.id }" data-sortable="${ header.sortable }" >
                <span>${ header.title }</span>
            </div>
 
        `).join('')
 
  createTableRowsTemplate = (data = this.data) => data.map(product =>
    `
      <a href="/products/${ product.id }" class="sortable-table__row">
          ${ this.createTableCell(product) }
      </a>
      `).join('')
 
  createTableCell = (product) => this.headerConfig.map(header =>
    `
       ${ header.id == 'images' ? header.template('images') : '<div class="sortable-table__cell">' + product[header.id] + '</div>'}
 
    `
  ).join('')
 
  remove() {
    this.element.remove();
  }
 
  destroy() {
    this.remove();
  }
 
  sort(field, order) {
    const sortedData = this.sortData(field, order);
    this.subElements.body.innerHTML = this.createTableRowsTemplate(sortedData);
  }
 
  sortData(field, order) {
    const arr = [...this.data];
    const column = this.headerConfig.find(item => item.id === field);
    const { sortType } = column;
    const directions = {
      asc: 1,
      desc: -1
    };
    const direction = directions[order];
 
    return arr.sort((a, b) => {
      switch (sortType) {
      case 'number':
        return direction * (a[field] - b[field]);
      case 'string' :
        return direction * a[field].localeCompare(b[field], ['ru', 'en']);
      default :
        throw new Error(`Unknown type ${sortType}`);   
      }
    });
  }
 
}
 
class SortableTableV2 extends SortableTableV1 {
 
  arrow
 
  constructor(headerConfig, {
    data = [],
    sorted = {
      id: headerConfig.find(item => item.sortable).id,
      order: 'asc'
    }
  } = {}) {
 
    super(headerConfig, data);
 
    this.subElements = {
      body: this.element.querySelector('[data-element="body"]'),
      header: this.element.querySelector('[data-element="header"]'),
    };
 
    this.subElements.header.addEventListener("pointerdown", this.sortOnClick);
 
    this.sorted = sorted;
 
    this.arrow = this.createArrow();
 
    const sortedHeaderSelector = '[data-id=' + this.sorted.id + ']';
 
    this.subElements.header.querySelector(sortedHeaderSelector).append(this.createArrow());
  }
 
  createArrow() {
    const element = document.createElement('div');
    element.innerHTML = this.createArrowTemplate();
    return element.firstElementChild;
  }
 
  createArrowTemplate() {
    return (
      `<span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>`
    );
  }
 
  sortOnClick = (event) => {
    const targetCell = event.target.closest(".sortable-table__cell");
 
    if (SortableTable.arrow) {
      SortableTable.arrow.remove();
    }
 
    targetCell.append(this.arrow);
 
    SortableTable.arrow = this.arrow;
 
    if (targetCell.dataset.sortable === "true") {
      const field = targetCell.dataset.id;
      const order = targetCell.dataset.order === "desc" ? "asc" : "desc";
 
      this.sort(field, order);
    }
  }
 
  destroy() {
    super.destroy();
    this.subElements.header.removeEventListener("pointerdown", this.sortOnClick);
  }
}
  
const BACKEND_URL = 'https://course-js.javascript.ru';
 
export default class SortableTable extends SortableTableV2 {
  constructor(headersConfig, {
      url = '',
    data = [],
    sorted = {},
    isSortLocally = false,
  } = {}) {
 
      super(headersConfig, data);
      this.url = new URL(url, BACKEND_URL);
      this.data = data;
      this.isSortLocally = isSortLocally;

      isSortLocally ? this.sortOnClient(this.sorted.id, this.sorted.order) : this.sortOnServer(this.sorted.id, this.sorted.order);
      
  }

  async render() {
  	this.isSortLocally ? await this.sortOnClient(this.sorted.id, this.sorted.order) : await this.sortOnServer(this.sorted.id, this.sorted.order);
  }
 
 async sortOnClient(id, order) {
      await this.loadData()
      this.sort(id, order) 
  }
 
  async sortOnServer(id, order) {
      await this.loadSortedData(id, order)
      this.subElements.body.innerHTML = this.createTableRowsTemplate(this.data);
  }
 
  async loadData() {
  	this.data = Object.values(await fetchJson(this.url));
  }
 
   async loadSortedData(sortColumnId, order) {
   	this.url.searchParams.set('_sort', sortColumnId);
   	this.url.searchParams.set('_order', order);
	this.data = Object.values(await fetchJson(this.url))
  }

}