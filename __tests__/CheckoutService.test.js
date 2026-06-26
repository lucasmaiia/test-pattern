import { CheckoutService } from '../src/services/CheckoutService.js';
import { UserMother } from './builders/UserMother.js';
import { CarrinhoBuilder } from './builders/CarrinhoBuilder.js';
import { Item } from '../src/domain/Item.js';

describe('CheckoutService', () => {
    const cartaoQualquer = { numero: '1234' };

    describe('quando o pagamento falha', () => {
        it('deve retornar null sem salvar o pedido', async () => {
            // Arrange
            const carrinho = new CarrinhoBuilder().build();

            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: false }) };

            // Dummies: dependências que não devem ser chamadas neste fluxo
            const repositoryDummy = {};
            const emailDummy = {};

            const checkoutService = new CheckoutService(gatewayStub, repositoryDummy, emailDummy);

            // Act
            const pedido = await checkoutService.processarPedido(carrinho, cartaoQualquer);

            // Assert — verificação de estado
            expect(pedido).toBeNull();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve aplicar 10% de desconto e enviar e-mail de confirmação', async () => {
            // Arrange
            const usuarioPremium = UserMother.umUsuarioPremium();
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([new Item('Tênis', 200.00)])
                .build();

            const gatewayStub = { cobrar: jest.fn().mockResolvedValue({ success: true }) };
            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({ id: 'PEDIDO-001', totalFinal: 180, status: 'PROCESSADO' }),
            };

            // Mock: queremos verificar SE foi chamado e COM QUAIS argumentos
            const emailMock = { enviarEmail: jest.fn().mockResolvedValue(undefined) };

            const checkoutService = new CheckoutService(gatewayStub, repositoryStub, emailMock);

            // Act
            const pedidoSalvo = await checkoutService.processarPedido(carrinho, cartaoQualquer);

            // Assert — verificação de estado: desconto de 10% aplicado (R$200 → R$180)
            expect(pedidoSalvo.id).toBe('PEDIDO-001');
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(180, cartaoQualquer);

            // Assert — verificação de comportamento (Mock): e-mail enviado ao usuário certo
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                expect.stringContaining('PEDIDO-001'),
            );
        });
    });

    describe('Construção de carrinhos via Data Builder', () => {

        it('deve criar um carrinho padrão com 1 item e total de R$100', () => {
            const carrinho = new CarrinhoBuilder().build();

            expect(carrinho.itens).toHaveLength(1);
            expect(carrinho.calcularTotal()).toBe(100.00);
            expect(carrinho.user.isPremium()).toBe(false);
        });

        it('deve criar um carrinho vazio com total zero', () => {
            const carrinho = new CarrinhoBuilder()
                .vazio()
                .build();

            expect(carrinho.itens).toHaveLength(0);
            expect(carrinho.calcularTotal()).toBe(0);
        });

        it('deve criar um carrinho com usuário premium e itens customizados', () => {
            const carrinho = new CarrinhoBuilder()
                .comUser(UserMother.umUsuarioPremium())
                .comItens([new Item('Notebook', 3000.00), new Item('Mouse', 150.00)])
                .build();

            expect(carrinho.user.isPremium()).toBe(true);
            expect(carrinho.itens).toHaveLength(2);
            expect(carrinho.calcularTotal()).toBe(3150.00);
        });
    });

    describe('Criação de usuários via Object Mother', () => {
        it('deve criar um usuário padrão sem desconto premium', () => {
            const usuario = UserMother.umUsuarioPadrao();

            expect(usuario.nome).toBe('João Silva');
            expect(usuario.email).toBe('joao@email.com');
            expect(usuario.tipo).toBe('PADRAO');
            expect(usuario.isPremium()).toBe(false);
        });

        it('deve criar um usuário premium com acesso a desconto', () => {
            const usuario = UserMother.umUsuarioPremium();

            expect(usuario.nome).toBe('Maria Santos');
            expect(usuario.email).toBe('premium@email.com');
            expect(usuario.tipo).toBe('PREMIUM');
            expect(usuario.isPremium()).toBe(true);
        });
    });
});
