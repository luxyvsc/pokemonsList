import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PokemonListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ name: string; url: string }>;
}

export interface PokemonDetails {
  id: number;
  name: string;
  sprites: any;
  types: Array<{ slot: number; type: { name: string } }>;
  // Adicione outros campos conforme necessário
}

@Injectable({
  providedIn: 'root'
})
export class PokeApiService {

  private baseUrl: string = 'https://pokeapi.co/api/v2/pokemon/';

  constructor(private http: HttpClient) {}

  apiListAllPokemons(offset: number, limit: number): Observable<PokemonListResponse> {
    const url = `${this.baseUrl}?offset=${offset}&limit=${limit}`;
    return this.http.get<PokemonListResponse>(url);
  }

  public apiGetPokemons(url: string): Observable<PokemonDetails> {
    return this.http.get<PokemonDetails>(url);
  }
}
