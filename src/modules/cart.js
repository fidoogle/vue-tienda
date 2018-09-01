import { db } from "@/main";
const initialState = () => ({
  cartId: null,
  cart: [],
  totalProducts: 0,
  selectedProduct: null //Product just added to cart
});

export default {
  state: initialState(),
  actions: {
    createCartIfNotExists({ commit, state }, user) {
      db.collection("carts")
        .doc(user.uid)
        .onSnapshot(
          cartSnap => {
            let cart;
            if (!cartSnap.exists) {
              cart = {
                products: [],
                totalProducts: 0
              };
              db.collection("carts")
                .doc(user.uid)
                .set(cart);
            } else {
              cart = cartSnap.data();
            }
            commit("setCart", { cart, cartId: user.uid });
          },
          error => {
            console.log("listener cart off...");
          }
        );
    },
    updateCart({ commit, state }, data) {
      let cart = db.collection("carts").doc(state.cartId);
      const product = data.product;
      cart.get().then(doc => {
        let cartData = doc.data();
        let productsInCart = cartData.products;
        const oldProductInCart = findProductByKey(
          productsInCart,
          "id",
          product.id
        );

        if (!oldProductInCart) {
          //this product is not yet in cart
          if (data.type === "increment") {
            productsInCart.push({
              id: product.id,
              name: product.name,
              qty: 1,
              price: product.price
            });
            cartData.totalProducts += 1;
          }
        } else {
          //this product is already in cart
          if (data.type === "increment") {
            oldProductInCart.qty += 1;
            cartData.totalProducts += 1;
          } else {
            //Remove product from cart if user is removing the only one left of that product
            if (oldProductInCart.qty === 1) {
              const index = productsInCart.findIndex(
                obj => obj.id === product.id
              );
              cartData.products = [
                ...productsInCart.slice(0, index),
                ...productsInCart.slice(index + 1)
              ];
              cartData.totalProducts -= 1;
            } else {
              //Else just decrement quantitiy
              oldProductInCart.qty -= 1;
              cartData.totalProducts -= 1;
            }
          }
        }
        //updates firestore
        cart.update(cartData).then(() => {
          commit("updateCart", cartData); //updates local state
        });
      });
    }
  },
  mutations: {
    setCart(state, data) {
      state.cart = data.cart.products;
      state.totalProducts = data.cart.totalProducts;
      state.cartId = data.cartId;
    },
    updateCart(state, data) {
      state.cart = data.products;
      state.totalProducts = data.totalProducts;
    },
    setActiveProductInCart(state, product) {
      state.selectedProduct = product;
    },
    resetCart(state) {
      const initial = initialState();
      Object.keys(initial).forEach(key => {
        if (key !== "cartId") {
          state[key] = initial[key];
        }
      });
    }
  },
  getters: {
    //Show qty in cart for selected product at bottom of screen
    qtyProductInCart: state => {
      if (!state.selectedProduct) return 0;
      const selectedProduct = state.cart.filter(
        obj => obj.id === state.selectedProduct.id
      )[0];
      if (selectedProduct) {
        return selectedProduct.qty;
      }
      return 0;
    },
    totalCostCart: state => {
      let totalCost = 0;
      if (state.cart.length) {
        state.cart.map(product => {
          totalCost += parseFloat(product.price) * parseInt(product.qty);
        });
      }
      return totalCost;
    }
  }
};

const findProductByKey = (array, key, value) => {
  for (let i = 0; i < array.length; i++) {
    if (array[i][key] === value) {
      return array[i];
    }
  }
  return null;
};
