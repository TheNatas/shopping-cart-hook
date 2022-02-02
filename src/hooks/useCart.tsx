import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId);

      if (productInCart){
        const response = await api.get(`stock/${productId}`);
        if (response.data.amount < productInCart.amount+1){
          toast.error('Quantidade solicitada fora de estoque');
        }else{
          setCart(() => {
            const newCart = cart.map(product => product.id === productId ? {...product, amount: product.amount+1} : product)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            return newCart;
          });
        }
      }
      else{
        const response = await api.get(`products/${productId}`);
        setCart(() => {
          const newCart = [{...response.data, amount: 1}, ...cart];
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          return newCart;
        });
      }
    } 
    catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(() => {
        const newCart = cart.filter(product => product.id !== productId)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        return newCart;
      });
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;

      const response = await api.get(`stock/${productId}`);
      if (response.data.amount < amount){
        toast.error('Quantidade solicitada fora de estoque');
      }else{
        setCart(() => {
          const newCart = cart.map(product => product.id === productId ? ({...product, amount: amount}) : product)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
          return newCart;
        });
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
