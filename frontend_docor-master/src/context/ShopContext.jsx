import { createContext, useContext } from 'react';

const ShopContext = createContext();

export const useShop = () => useContext(ShopContext);

export default ShopContext;
