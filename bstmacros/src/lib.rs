extern crate proc_macro;
use proc_macro::TokenStream;
use syn::{
    parse_macro_input, Data, DeriveInput, Field, Fields, GenericArgument, PathArguments, Type,
    TypePath,
};

fn get_inner_type_from_path_argument(path_arguments: &PathArguments) -> String {
    match path_arguments {
        PathArguments::AngleBracketed(path_arguments) => {
            match path_arguments.args.first().unwrap() {
                GenericArgument::Type(inner_ty) => get_js_type(&inner_ty),
                other => panic!("Could not determine JS type for {:?}", other),
            }
        }
        other => panic!("Could not determine JS type for {:?}", other),
    }
}

fn get_js_type_from_type_path(type_path: &TypePath) -> String {
    let last = type_path.path.segments.last().unwrap();
    let typename = last.ident.to_string();
    match &typename[..] {
        "String" => String::from("string"),
        "u32" | "i32" => String::from("number"),
        "u64" | "i64" => String::from("number"),
        "Vec" => {
            let inner_type = get_inner_type_from_path_argument(&last.arguments);
            format!("{}[]", inner_type)
        }
        "Option" => get_inner_type_from_path_argument(&last.arguments),
        other => String::from(other), // most likely a class name
    }
}

fn get_js_type(ty: &Type) -> String {
    match ty {
        Type::Path(item) => get_js_type_from_type_path(item),
        other => panic!("Could not determine JS type for {:?}", other),
    }
}

fn get_js_field_string(field: &Field) -> String {
    let field_name = field.ident.as_ref().unwrap().to_string();
    let field_type_js = get_js_type(&field.ty);
    format!("  {}: {};\n", field_name, field_type_js)
}

#[proc_macro_derive(GenJs)]
pub fn gen_js(tokens: TokenStream) -> TokenStream {
    let input = parse_macro_input!(tokens as DeriveInput);
    // println!("{:?}", input);

    let fields = match input.data {
        Data::Struct(data_struct) => match data_struct.fields {
            Fields::Named(fields_named) => fields_named.named,
            _ => panic!("Expected Fields::Named element not found in DataStruct"),
        },
        _ => panic!("Incorrect format of DeriveInput, something's seriously wrong"),
    };

    let struct_name = input.ident;
    let field_strings: Vec<String> = fields.iter().map(|x| get_js_field_string(&x)).collect();

    let javascript = format!(
        "export type {} = {{\n{}}};",
        struct_name,
        field_strings.join("")
    );
    let rust = format!(
        "impl {} {{ pub fn generate_js() -> &'static str {{ \"{}\" }} }}",
        struct_name, javascript,
    );
    rust.parse().unwrap()
}
