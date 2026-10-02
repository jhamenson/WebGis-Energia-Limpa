import geopandas as gpd
from shapely.ops import unary_union
import pandas as pd
import json
import os

print("=== 1. Carregando dados originais e novos rios ===")
p1 = r"C:\QGIS_camadas\Camadas\Vetores\Camadas criadas\rios que faltam webgis.shp"
p2 = r"C:\QGIS_camadas\Camadas\Vetores\Camadas criadas\rios que faltam webgis 2.shp"
p_curr = r"C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\data\massa_de_agua.geojson"
p_out = r"C:\Users\jhame\.gemini\antigravity\scratch\geoportal-webgis\data\massa_de_agua.geojson"

df1 = gpd.read_file(p1).to_crs("EPSG:4674")
df2 = gpd.read_file(p2).to_crs("EPSG:4674")
df_curr = gpd.read_file(p_curr).to_crs("EPSG:4674")

rows = []

# [PT-BR] 1. Novos Rios Principais: Rio Trombetas e Rio Cachorro (Oriximiná/PA)
# [EN] 1. New Main Rivers: Trombetas River and Cachorro River (Oriximiná/PA)
for idx, row in df1.iterrows():
    name = row.get('nmoriginal') or 'Rio Trombetas'
    mun = row.get('nmmun') or 'Oriximiná'
    ufe = row.get('nmufe') or 'PA'
    area = float(row.get('nuareakm2') or row.geometry.area * 12321)
    ti_conn = "Kaxuyana-Tunayana / Trombetas-Mapuera" if "Cachorro" in name else "Kaxuyana-Tunayana"
    rows.append({
        'nmoriginal': f"{name} ({ufe})",
        'detipomda': 'Curso d\'Água Principal / Calha Fluvial',
        'dedominio': 'Domínio Público da União',
        'nmmun': 'Oriximiná',
        'nmufe': 'PA',
        'nuareakm2': round(area, 4),
        'ti_conexao': ti_conn,
        'datum': 'SIRGAS 2000 (EPSG:4674)',
        'geometry': row.geometry
    })

# [PT-BR] 2. Novos Corpos Hídricos de Uaçá: Rios, Igarapés e Lagos (Oiapoque/AP)
# [EN] 2. New Uaçá Waterbodies: Rivers, Streams and Lakes (Oiapoque/AP)
for idx, row in df2.iterrows():
    detipo = 'Lago/Lagoa' if str(row.get('detipomda')).strip().lower() == 'lago/lagoa' else 'Curso d\'Água / Igarapé'
    area = float(row.get('nuareakm2') or row.geometry.area * 12321)
    name = f"Recurso Hídrico TI Uaçá #{idx+1} ({detipo})"
    rows.append({
        'nmoriginal': name,
        'detipomda': f"{detipo} - Bacia do Uaçá",
        'dedominio': 'Domínio Público da União',
        'nmmun': 'Oiapoque',
        'nmufe': 'AP',
        'nuareakm2': round(area, 4),
        'ti_conexao': 'Uaçá',
        'datum': 'SIRGAS 2000 (EPSG:4674)',
        'geometry': row.geometry
    })

# [PT-BR] 3. Remove 24 retalhos de df_curr sobrepostos pelo df1 (substituídos pela geometria oficial completa)
# [EN] 3. Remove 24 slivers from df_curr overlapping df1 (replaced by official complete geometry)
overlap_mask = df_curr.geometry.apply(lambda g: df1.intersects(g).any())
curr_filtered = df_curr[~overlap_mask].copy()

# [PT-BR] 4. Filtra ruídos microscópicos (< 3 ha) e dissolve trechos contíguos do mesmo rio
# [EN] 4. Filter microscopic noise (< 3 ha) and spatially dissolve contiguous river stretches
valid_curr = curr_filtered[curr_filtered['nuareakm2'] >= 0.03].copy()

for (name, ufe, ti, mun, detipo, dedominio), group in valid_curr.groupby(
    ['nmoriginal', 'nmufe', 'ti_conexao', 'nmmun', 'detipomda', 'dedominio']
):
    u = unary_union(group.geometry)
    geoms = list(u.geoms) if u.geom_type == 'MultiPolygon' else [u]
    for g in geoms:
        area_km2 = round(g.area * 12321, 4)
        if area_km2 >= 0.03:
            rows.append({
                'nmoriginal': name,
                'detipomda': detipo,
                'dedominio': dedominio,
                'nmmun': mun,
                'nmufe': ufe,
                'nuareakm2': area_km2,
                'ti_conexao': ti,
                'datum': 'SIRGAS 2000 (EPSG:4674)',
                'geometry': g
            })

final_gdf = gpd.GeoDataFrame(rows, crs="EPSG:4674")
final_gdf['gid'] = range(1, len(final_gdf) + 1)

# Simplificação suave de 0.00005 graus (~5.5 metros) para otimização web
final_gdf['geometry'] = final_gdf['geometry'].simplify(0.00005, preserve_topology=True)

# Reordena colunas do schema oficial
cols = ['gid', 'nmoriginal', 'detipomda', 'dedominio', 'nmmun', 'nmufe', 'nuareakm2', 'ti_conexao', 'datum', 'geometry']
final_gdf = final_gdf[cols]

final_gdf.to_file(p_out, driver="GeoJSON")

sz_mb = os.path.getsize(p_out) / (1024 * 1024)
print(f"Salvo em '{p_out}' com sucesso!")
print(f"Total de recursos hídricos recalculados: {len(final_gdf)}")
print(f"Área hídrica total: {final_gdf['nuareakm2'].sum():.2f} km²")
print(f"Tamanho do arquivo: {sz_mb:.2f} MB")
