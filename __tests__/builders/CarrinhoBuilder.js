import { Carrinho } from '../../src/domain/Carrinho.js';
import { Item } from '../../src/domain/Item.js';
import { UserMother } from './UserMother.js';

const ITEM_PADRAO = new Item('Produto Padrão', 100.00);

export class CarrinhoBuilder {
    constructor() {
        this.usuario = UserMother.umUsuarioPadrao();
        this.itens = [ITEM_PADRAO];
    }

    comUser(user) {
        this.usuario = user;
        return this;
    }

    comItens(itens) {
        this.itens = itens;
        return this;
    }

    vazio() {
        this.itens = [];
        return this;
    }

    build() {
        return new Carrinho(this.usuario, this.itens);
    }
}
