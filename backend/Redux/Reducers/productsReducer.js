import {
    PRODUCT_LIST_REQUEST,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_LIST_FAIL,
    CATEGORY_LIST_REQUEST,
    CATEGORY_LIST_SUCCESS,
    CATEGORY_LIST_FAIL,
} from "../constants";

const initialState = {
    items: [],
    categories: [],
    loading: false,
    error: null,
    categoriesLoading: false,
    categoriesError: null,
};

const productsReducer = (state = initialState, action) => {
    switch (action.type) {
        case PRODUCT_LIST_REQUEST:
            return { ...state, loading: true, error: null };
        case PRODUCT_LIST_SUCCESS:
            return { ...state, loading: false, items: action.payload || [] };
        case PRODUCT_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CATEGORY_LIST_REQUEST:
            return { ...state, categoriesLoading: true, categoriesError: null };
        case CATEGORY_LIST_SUCCESS:
            return { ...state, categoriesLoading: false, categories: action.payload || [] };
        case CATEGORY_LIST_FAIL:
            return { ...state, categoriesLoading: false, categoriesError: action.payload };
        default:
            return state;
    }
};

export default productsReducer;
