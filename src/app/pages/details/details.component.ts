import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { forkJoin, Subject, of } from 'rxjs';
import { switchMap, takeUntil, catchError } from 'rxjs/operators';
import { PokeApiService } from '../../service/poke-api.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit, OnDestroy {
  id?: string | null;
  data: any;
  loading = false;
  loaded = false;
  apiError = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private pokeApi: PokeApiService,
    private location: Location
  ) {}

  // Volta pelo histórico para manter a página da lista; em link direto cai no routerLink="/"
  goBack(event: Event): void {
    if ((history.state?.navigationId ?? 1) > 1) {
      event.preventDefault();
      this.location.back();
    }
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params: ParamMap) => {
          this.id = params.get('id');
          if (!this.id) {
            this.apiError = true;
            return of([]);
          }
          this.apiError = false;
            this.loaded = false;
            this.loading = true;
          const pokemon$ = this.pokeApi.apiGetPokemons(`https://pokeapi.co/api/v2/pokemon/${this.id}`);
          const species$ = this.pokeApi.apiGetPokemons(`https://pokeapi.co/api/v2/pokemon-species/${this.id}`);
          return forkJoin([pokemon$, species$]).pipe(
            catchError(() => {
              this.apiError = true;
              return of([]);
            })
          );
        })
      )
      .subscribe(res => {
        this.loading = false;
        if (this.apiError) return;
        this.data = res;
        this.loaded = true;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}