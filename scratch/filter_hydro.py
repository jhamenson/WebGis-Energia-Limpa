import geopandas as gpd
import pyogrio

tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
shp_path = r"C:\QGIS_camadas\Camadas\Vetores\hidrografia\hydrography_amazonia_legal.shp"
hydro = gpd.read_file(shp_path, engine="pyogrio")

print("TIs CRS:", tis.crs)
print("Hydro CRS:", hydro.crs)

if hydro.crs != tis.crs:
    hydro = hydro.to_crs(tis.crs)

print("TIs:")
for idx, r in tis.iterrows():
    print(f" - {r['terrai_nom']} ({r['uf_sigla']})")

# Interseção direta com as 4 TIs
direct_sjoin = gpd.sjoin(hydro, tis[['geometry', 'terrai_nom', 'uf_sigla']], how='inner', predicate='intersects')
print(f"\nFeições de hidrografia que cruzam diretamente as 4 TIs: {len(direct_sjoin)}")
print("Distribuição por TI:")
print(direct_sjoin['terrai_nom'].value_counts())

# Vamos ver feições com um buffer de 0.05 graus (~5.5 km de amortecimento/conexão hidrológica)
tis_buf = tis.copy()
tis_buf['geometry'] = tis.geometry.buffer(0.05)
buf_sjoin = gpd.sjoin(hydro, tis_buf[['geometry', 'terrai_nom']], how='inner', predicate='intersects')
print(f"\nFeições de hidrografia com buffer de 5km ao redor das 4 TIs: {len(buf_sjoin)}")
print(buf_sjoin['terrai_nom'].value_counts())

# Unique indices
sel_indices = buf_sjoin.index.unique()
selected_hydro = hydro.loc[sel_indices].copy()
print(f"\nTotal feições únicas selecionadas: {len(selected_hydro)}")
print("Amostra de dados das feições selecionadas:")
print(selected_hydro[['main_class', 'class_name', 'state', 'area_km']].head(10))
print("Classes encontradas:", selected_hydro['class_name'].value_counts().to_dict())
print("Estados encontrados:", selected_hydro['state'].value_counts().to_dict())
