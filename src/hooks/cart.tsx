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

const cartStorageKeys = {
  products: 'GoMarketplace::products',
};

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        cartStorageKeys.products,
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = [...products];
      const product = newProducts.find(item => item.id === id);

      if (product) {
        product.quantity += 1;

        setProducts(newProducts);
      }

      AsyncStorage.setItem(
        cartStorageKeys.products,
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProducts = [...products];
      const index = newProducts.findIndex(item => item.id === id);

      if (newProducts[index].quantity <= 1) {
        newProducts.splice(index, 1);
      } else {
        newProducts[index].quantity -= 1;
      }
      setProducts(newProducts);

      AsyncStorage.setItem(
        cartStorageKeys.products,
        JSON.stringify(newProducts),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const existentProduct = products.find(item => item.id === product.id);

      if (!existentProduct) {
        AsyncStorage.setItem(
          cartStorageKeys.products,
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );

        setProducts(state => {
          return [...state, { ...product, quantity: 1 }];
        });
      } else {
        increment(product.id);
      }
    },
    [increment, products],
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
