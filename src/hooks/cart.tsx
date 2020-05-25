import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsFromStorage = await AsyncStorage.getItem('@GoMarketplace');

      if (productsFromStorage) {
        setProducts(JSON.parse(productsFromStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const items = products.map(product => {
        return product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product;
      });

      AsyncStorage.setItem('@GoMarketplace', JSON.stringify(items));
      setProducts(items);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const items = products.map(product => {
        if (product.id === id && product.quantity > 1) {
          return {
            ...product,
            quantity: product.quantity - 1,
          };
        }
        return product;
      });

      setProducts(items);
      AsyncStorage.setItem('@GoMarketplace', JSON.stringify(items));
    },
    [products],
  );

  const addToCart = useCallback(
    async ({ id, title, image_url, price }: Omit<Product, 'quantity'>) => {
      const productItem = {
        id,
        title,
        image_url,
        price,
        quantity: 1,
      };

      const findItem = products.find(item => item.id === id);

      let listProduct;

      if (findItem) {
        listProduct = products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity + 1 }
            : product,
        );

        setProducts(listProduct);
        AsyncStorage.setItem('@GoMarketplace', JSON.stringify(listProduct));
      } else {
        listProduct = [...products, productItem];
        AsyncStorage.setItem('@GoMarketplace', JSON.stringify(listProduct));
        setProducts(listProduct);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
